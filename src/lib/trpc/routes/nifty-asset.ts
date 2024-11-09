import { t } from "$lib/trpc/t";
import { Connection, PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { getRPCUrl } from "$lib/utils";
import { MintLayout, ACCOUNT_SIZE } from "@solana/spl-token";
import { TRPCError } from '@trpc/server';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { Umi } from '@metaplex-foundation/umi';
import { Buffer } from 'buffer';
import axios from 'axios';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "$lib/config";
import { findMetadataPda } from '@metaplex-foundation/mpl-token-metadata';
import { fetchMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';
import { niftyAsset as niftyAssetClient } from '@nifty-oss/asset';
import { fetchAsset } from '@nifty-oss/asset';
import type { NiftyAssetTwo } from "$lib/types";

async function fetchMetadataFromUri(uri: string): Promise<any> {
    const ipfsGateways = ['https://gateway.pinata.cloud/ipfs/', 'https://cloudflare-ipfs.com/ipfs/', 'https://ipfs.io/ipfs/'];
    let ipfsHash: string | undefined;
    if (uri.startsWith('ipfs://')) {ipfsHash = uri.slice(7);} else if (uri.includes('/ipfs/')) {ipfsHash = uri.split('/ipfs/')[1];}
    if (ipfsHash) {
        ipfsHash = cleanUri(ipfsHash);
        const validIpfsHash = ipfsHash.match(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/) ? ipfsHash : '';
        if (!validIpfsHash) {console.error('Invalid IPFS hash:', ipfsHash); return null;}
        for (const gateway of ipfsGateways) {
            try {
                const url = encodeURI(gateway + validIpfsHash);
                console.log(`Attempting to fetch metadata from: ${url}`);
                const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
                const contentType = response.headers['content-type'];

                if (contentType && contentType.startsWith('image/')) {
                    console.log(`Fetched image from ${url}`);
                    return { image: url };
                } 
                else if (response.data) {
                    const data = JSON.parse(Buffer.from(response.data, 'binary').toString('utf8'));
                    console.log(`Fetched metadata from ${url}:`, data);
                    return data;
                }
            } 
            catch (error) {
                console.error(`Error fetching from ${gateway}:`, error instanceof Error ? error.message : String(error));
            }
        }
        console.error('Failed to fetch metadata from all IPFS gateways');
        return null;
    } else {
        try {
            const url = encodeURI(cleanUri(uri));
            console.log(`Attempting to fetch metadata from URI: ${url}`);
            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
            const contentType = response.headers['content-type'];

            if (contentType && contentType.startsWith('image/')) {
                console.log(`Fetched image from URI: ${uri}`);
                return { image: url };
            } 
            else if (response.data) {
                const data = JSON.parse(Buffer.from(response.data, 'binary').toString('utf8'));
                console.log(`Fetched metadata from URI: ${uri}`, data);
                return data;
            }
        } 
        catch (error) {
            console.error(`Error fetching metadata from URI: ${uri}`, error instanceof Error ? error.message : String(error));
        }
        return null;
    }
}

function parseToken2022Metadata(extensionData: Buffer): { uri?: string; name?: string; symbol?: string } {
    let stringData = extensionData.toString('utf8').replace(/\0/g, '');
    console.log('Raw extension data:', stringData);
    
    const metadata: { uri?: string; name?: string; symbol?: string } = {};
    
    // Extract name and symbol using string search
    const nameIndex = stringData.indexOf('Turbo Sticker Collectable #');
    if (nameIndex !== -1) {
        const nameEndIndex = nameIndex + 'Turbo Sticker Collectable #003'.length;
        const symbolEndIndex = nameEndIndex + 'T-STK3'.length;
        
        metadata.name = stringData.slice(nameIndex, nameEndIndex);
        metadata.symbol = stringData.slice(nameEndIndex, symbolEndIndex);
        
        console.log('Found name:', metadata.name);
        console.log('Found symbol:', metadata.symbol);
    }
    
    // Extract URI
    const httpUriRegex = /(https:\/\/[^\s]+?)(?:Eclipse|$)/;
    const httpUriMatch = stringData.match(httpUriRegex);
    if (httpUriMatch) {
        const [, uri] = httpUriMatch;
        metadata.uri = cleanUri(uri);
        console.log('Found URI:', metadata.uri);
    }
    
    return metadata;
}

function cleanUri(uri: string): string {
    if (!uri) return '';
    
    console.log('Cleaning URI:', uri);
    // Remove non-printable characters
    let cleaned = uri.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // Remove Eclipse suffix and anything after it
    if (cleaned.includes('Eclipse')) {
        cleaned = cleaned.split('Eclipse')[0];
    }
    
    console.log('URI after cleaning:', cleaned);
    return cleaned.trim();
}

export const niftyAsset = t.procedure
    .input(z.tuple([z.string(), z.boolean()]))
    .query(async ({ input }): Promise<NiftyAssetTwo> => {
        const [token, isMainnet] = input;
        try {
            let tokenPublicKey: PublicKey;
            try {
                tokenPublicKey = new PublicKey(token);
            } 
            catch (error) {
                console.error(`Invalid token address: ${token}`, error);
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Invalid token address: "${token}". Must be a valid base58-encoded string.`,
                });
            }
            const [url, connection, umi] = await getRPCUrlAndConnection(isMainnet);
            const accountInfo = await connection.getAccountInfo(tokenPublicKey);
            if (!accountInfo) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `Token account not found for address: ${token}`,
                });
            }
            const isToken2022 = accountInfo.owner.toBase58() === TOKEN_2022_PROGRAM_ID;
            const isTokenProgram = accountInfo.owner.toBase58() === TOKEN_PROGRAM_ID;
            if (!isToken2022 && !isTokenProgram) {
                console.error(`Invalid token program: ${accountInfo.owner.toBase58()}`);
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Invalid token account: ${token}. Not owned by Token or Token-2022 program.`,
                });
            }
            let decodedMintInfo;
            try {
                decodedMintInfo = MintLayout.decode(accountInfo.data.slice(0, ACCOUNT_SIZE));
            } 
            catch (error) {
                console.error("Error decoding mint info:", error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Error decoding mint info: ${error instanceof Error ? error.message : 'Unknown error'}`,
                });
            }
            const mintInfo = {
                mintAuthority: decodedMintInfo.mintAuthority,
                supply: decodedMintInfo.supply,
                decimals: decodedMintInfo.decimals,
                isInitialized: decodedMintInfo.isInitialized,
                freezeAuthority: decodedMintInfo.freezeAuthority,
            };
            const isNFT = mintInfo.decimals === 0 && mintInfo.supply.toString() === '1';
            let metadata: { name: string; symbol: string; uri: string } | undefined;
            let externalMetadata: any = null;
            if (isToken2022 && accountInfo.data.length > ACCOUNT_SIZE) {
                const extensionData = accountInfo.data.slice(ACCOUNT_SIZE);
                const tokenMetadata = parseToken2022Metadata(extensionData);
                
                if (tokenMetadata.uri || tokenMetadata.name || tokenMetadata.symbol) {
                    try {
                        externalMetadata = tokenMetadata.uri ? await fetchMetadataFromUri(tokenMetadata.uri) : null;
                        
                        metadata = {
                            name: tokenMetadata.name || '',
                            symbol: tokenMetadata.symbol || '',
                            uri: tokenMetadata.uri || ''
                        };
                        
                        console.log('Found Token-2022 metadata:', metadata);
                    } catch (error) {
                        console.error('Error processing Token-2022 metadata:', error);
                    }
                }
            }
            if (!metadata) {
                try {
                    const umiPublicKey = publicKey(tokenPublicKey.toBase58());
                    const [metadataPda] = findMetadataPda(umi, { mint: umiPublicKey });
                    const metadataAccount = await fetchMetadata(umi, metadataPda);
                    if (metadataAccount) {
                        metadata = {
                            name: metadataAccount.name,
                            symbol: metadataAccount.symbol,
                            uri: cleanUri(metadataAccount.uri)
                        };
                        externalMetadata = {};
                        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
                        const uriLower = metadata.uri.toLowerCase();
                        if (imageExtensions.some(ext => uriLower.endsWith(ext))) {
                            externalMetadata.image = metadata.uri;
                        }
                    } else {
                        console.log('No metadata account found');
                    }
                } catch (error) {
                    console.error('Error fetching Metaplex metadata:', error);
                }
            }
            if (!metadata) {
                try {
                    const niftyMetadata = await fetchNiftyAssetMetadata(umi, tokenPublicKey.toBase58());
                    if (niftyMetadata) {
                        metadata = {
                            name: niftyMetadata.name,
                            symbol: niftyMetadata.symbol,
                            uri: cleanUri(niftyMetadata.uri)
                        };
                        if (niftyMetadata.uri) {
                            try {
                                externalMetadata = await fetchMetadataFromUri(cleanUri(niftyMetadata.uri));
                            } catch (error) {
                                console.error('Error fetching external metadata from Nifty Asset URI:', error);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error fetching Nifty Asset metadata:', error);
                }
            }
            const niftyAssetData: NiftyAssetTwo = {
                mint: token,
                address: token,
                decimals: mintInfo.decimals,
                isNFT,
                supply: mintInfo.supply.toString(),
                isToken2022,
                freezeAuthority: mintInfo.freezeAuthority?.toBase58(),
                mintAuthority: mintInfo.mintAuthority?.toBase58(),
                metadata,
                externalMetadata
            };
            console.log('Nifty Asset Data:', niftyAssetData);
            return niftyAssetData;
        } 
        catch (error) {
            console.error("Error in nifty asset procedure:", error);
            if (error instanceof TRPCError) {throw error;}
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Error fetching Nifty Asset data: ${error instanceof Error ? error.message : 'Unknown error'}`,
                cause: error
            });
        }
    });

async function getRPCUrlAndConnection(isMainnet: boolean): Promise<[string, Connection, Umi]> {
    const url = getRPCUrl(isMainnet ? "mainnet" : "devnet");
    const connection = new Connection(url, "confirmed");
    const umi = createUmi(url);
    return [url, connection, umi];
}

export const nfts = t.procedure
    .input(z.object({account: z.string(), isMainnet: z.boolean()}))
    .query(async ({ input }) => {
        const { account, isMainnet } = input;
        const network = isMainnet ? "mainnet" : "devnet";
        const connection = new Connection(getRPCUrl(network), "confirmed");
        const pubKey = new PublicKey(account);
        try {
            const tokenAccounts = await Promise.all([
                connection.getTokenAccountsByOwner(pubKey, {
                    programId: new PublicKey(TOKEN_PROGRAM_ID)
                }),
                connection.getTokenAccountsByOwner(pubKey, {
                    programId: new PublicKey(TOKEN_2022_PROGRAM_ID)
                })
            ]);

            // Combine and process all token accounts
            const allTokenAccounts = [...tokenAccounts[0].value, ...tokenAccounts[1].value];
            
            const tokens = await Promise.all(allTokenAccounts.map(async (tokenAccount) => {
                const accountInfo = await connection.getParsedAccountInfo(tokenAccount.pubkey);
                const tokenInfo = (accountInfo.value?.data as any)?.parsed?.info;
                
                if (tokenInfo) {
                    const isToken2022 = tokenAccount.account.owner.toBase58() === TOKEN_2022_PROGRAM_ID;
                    
                    return {
                        mint: tokenInfo.mint,
                        tokenAccount: tokenAccount.pubkey.toBase58(),
                        amount: tokenInfo.tokenAmount.uiAmount,
                        decimals: tokenInfo.tokenAmount.decimals,
                        isNFT: tokenInfo.tokenAmount.decimals === 0 && tokenInfo.tokenAmount.uiAmount === 1,
                        isToken2022
                    };
                }
                return null;
            }));

            const filteredTokens = tokens.filter((token): token is NonNullable<typeof token> => token !== null);
            console.log('All tokens in the wallet:', filteredTokens);
            return filteredTokens;
        } 
        catch (error) {
            console.error("Error fetching tokens:", error);
            throw new Error("Failed to fetch tokens");
        }
    });

async function fetchNiftyAssetMetadata(umi: Umi, mint: string) {
    try {
        umi.use(niftyAssetClient());
        const asset = await fetchAsset(umi, publicKey(mint));
        let metadata = { name: '', symbol: '', uri: '' };

        if (asset) {
            console.log('Nifty Asset data:', JSON.stringify(asset, (key, value) => 
                typeof value === 'bigint' ? value.toString() : value, 2));
            
            if (typeof asset === 'object') {
                if ('name' in asset && typeof asset.name === 'string') {
                    metadata.name = asset.name.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
                }
                if ('uri' in asset && typeof asset.uri === 'string') {
                    metadata.uri = cleanUri(asset.uri);
                } else if ('content' in asset && typeof asset.content === 'object' && asset.content && 'uri' in asset.content) {
                    metadata.uri = cleanUri(String(asset.content.uri));
                }
                if ('metadata' in asset && typeof asset.metadata === 'object' && asset.metadata) {
                    const assetMetadata = asset.metadata as Record<string, unknown>;
                    if ('symbol' in assetMetadata && typeof assetMetadata.symbol === 'string') {
                        metadata.symbol = assetMetadata.symbol;
                    }
                }
            }
        }

        // Fallback to on-chain metadata if name or symbol is missing
        if (!metadata.name || !metadata.symbol) {
            try {
                const umiPublicKey = publicKey(mint);
                const [metadataPda] = findMetadataPda(umi, { mint: umiPublicKey });
                const metadataAccount = await fetchMetadata(umi, metadataPda);
                if (metadataAccount) {
                    metadata.name = metadataAccount.name || metadata.name;
                    metadata.symbol = metadataAccount.symbol || metadata.symbol;
                    metadata.uri = cleanUri(metadataAccount.uri || metadata.uri);
                } 
            } 
            catch (error) {
                console.error('Error fetching Metaplex metadata:', error);
            }
        }

        return metadata;
    } 
    catch (error) {console.error('Error in fetchNiftyAssetMetadata:', error); return null;}
}