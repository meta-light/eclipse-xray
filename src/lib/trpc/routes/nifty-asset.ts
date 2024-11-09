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
    console.log('Attempting to fetch metadata from URI:', uri);
    const ipfsGateways = [
        'https://gateway.pinata.cloud/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
        'https://ipfs.io/ipfs/',
        'https://ipfs.dweb.link/ipfs/'  // Added additional gateway
    ];

    let ipfsHash: string | undefined;
    if (uri.startsWith('ipfs://')) {
        ipfsHash = uri.slice(7);
    } else if (uri.includes('/ipfs/')) {
        ipfsHash = uri.split('/ipfs/')[1];
    }

    if (ipfsHash) {
        ipfsHash = cleanUri(ipfsHash);
        // More permissive IPFS hash validation
        if (!ipfsHash.match(/^[1-9A-HJ-NP-Za-km-z]{46,59}$/)) {
            console.error('Invalid IPFS hash:', ipfsHash);
            return null;
        }

        for (const gateway of ipfsGateways) {
            try {
                const url = encodeURI(gateway + ipfsHash);
                console.log(`Attempting IPFS gateway: ${url}`);
                const response = await axios.get(url, { 
                    responseType: 'arraybuffer', 
                    timeout: 5000,
                    headers: {
                        'Accept': 'application/json,*/*'
                    }
                });
                
                const contentType = response.headers['content-type'];
                console.log('Response content type:', contentType);

                if (contentType && contentType.startsWith('image/')) {
                    console.log(`Fetched image from ${url}`);
                    return { image: url };
                } else if (response.data) {
                    const data = JSON.parse(Buffer.from(response.data, 'binary').toString('utf8'));
                    console.log(`Fetched metadata from ${url}:`, data);
                    return data;
                }
            } catch (error) {
                console.error(`Error fetching from ${gateway}:`, error instanceof Error ? error.message : String(error));
            }
        }
    } else {
        try {
            const url = encodeURI(cleanUri(uri));
            console.log(`Attempting direct URI fetch: ${url}`);
            const response = await axios.get(url, { 
                responseType: 'arraybuffer', 
                timeout: 5000,
                headers: {
                    'Accept': 'application/json,*/*'
                }
            });
            
            const contentType = response.headers['content-type'];
            console.log('Response content type:', contentType);

            if (contentType && contentType.startsWith('image/')) {
                console.log(`Fetched image from URI: ${uri}`);
                return { image: url };
            } else if (response.data) {
                const data = JSON.parse(Buffer.from(response.data, 'binary').toString('utf8'));
                console.log(`Fetched metadata from URI: ${uri}`, data);
                return data;
            }
        } catch (error) {
            console.error(`Error fetching metadata from URI: ${uri}`, error instanceof Error ? error.message : String(error));
        }
    }
    return null;
}

function parseToken2022Metadata(extensionData: Buffer): { uri?: string; name?: string; symbol?: string } {
    let stringData = extensionData.toString('utf8').replace(/\0/g, '');
    console.log('Raw extension data:', stringData);
    
    const metadata: { uri?: string; name?: string; symbol?: string } = {};
    
    // Enhanced pattern matching for different NFT types
    const namePatterns = [
        /Turbo Sticker Collectable #\d{3}/,
        /Path of Discovery/,
        /ASC Sticker #\d{3}/,
        /VALIDATOR #\d{4}/,  // Added for validator NFTs
        /Turbo Sticker #\d{3}/  // Added for Turbo stickers
    ];

    // Try each pattern
    for (const pattern of namePatterns) {
        const match = stringData.match(pattern);
        if (match) {
            metadata.name = match[0];
            console.log('Found name with pattern:', pattern, ':', metadata.name);
            break;
        }
    }

    // Enhanced symbol patterns
    const symbolPatterns = [
        /T-STK\d/,
        /POD\d/,
        /A-STK\d/,
        /VLDTR/  // Added for validator NFTs
    ];

    // Try each symbol pattern
    for (const pattern of symbolPatterns) {
        const match = stringData.match(pattern);
        if (match) {
            metadata.symbol = match[0];
            console.log('Found symbol with pattern:', pattern, ':', metadata.symbol);
            break;
        }
    }

    // Update URI parsing to extract just the IPFS hash
    const ipfsPattern = /ipfs:\/\/([a-zA-Z0-9]+)/i;
    const ipfsMatch = stringData.match(ipfsPattern);
    
    if (ipfsMatch) {
        const ipfsHash = ipfsMatch[1].split(/[^a-zA-Z0-9]/)[0]; // Get clean hash before any extra data
        metadata.uri = `https://ipfs.io/ipfs/${ipfsHash}`; // Use gateway URL
        console.log('Found IPFS hash:', ipfsHash);
    } else {
        // Fallback to existing URI patterns if not IPFS
        const uriPatterns = [
            /(https:\/\/[^\s]+\.json)/i,
            /(https:\/\/[^\s]+)/i
        ];
        
        for (const pattern of uriPatterns) {
            const match = stringData.match(pattern);
            if (match) {
                metadata.uri = cleanUri(match[0]);
                break;
            }
        }
    }

    console.log('Final parsed Token2022 metadata:', metadata);
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
            let metadata: { name: string; symbol: string; uri: string } = {
                name: '',
                symbol: '',
                uri: ''
            };
            let externalMetadata: any = null;

            console.log(`Fetching metadata for token ${token}`);

            // Try Token-2022 metadata first
            if (isToken2022 && accountInfo.data.length > ACCOUNT_SIZE) {
                const extensionData = accountInfo.data.slice(ACCOUNT_SIZE);
                const tokenMetadata = parseToken2022Metadata(extensionData);
                
                metadata = {
                    name: tokenMetadata.name || '',
                    symbol: tokenMetadata.symbol || '',
                    uri: tokenMetadata.uri || ''
                };
                
                if (tokenMetadata.uri) {
                    try {
                        externalMetadata = await fetchMetadataFromUri(tokenMetadata.uri);
                        if (externalMetadata) {
                            metadata = {
                                name: externalMetadata.name || tokenMetadata.name || '',
                                symbol: externalMetadata.symbol || tokenMetadata.symbol || '',
                                uri: tokenMetadata.uri
                            };
                        }
                    } catch (error) {
                        console.error('Error fetching Token-2022 external metadata:', error);
                    }
                }
            }

            // Try Metaplex metadata if we still don't have complete metadata
            if (!metadata.name || !metadata.uri) {
                try {
                    const umiPublicKey = publicKey(tokenPublicKey.toBase58());
                    const [metadataPda] = findMetadataPda(umi, { mint: umiPublicKey });
                    const metadataAccount = await fetchMetadata(umi, metadataPda);
                    
                    if (metadataAccount) {
                        if (!externalMetadata && metadataAccount.uri) {
                            try {
                                externalMetadata = await fetchMetadataFromUri(metadataAccount.uri);
                            } catch (error) {
                                console.error('Error fetching Metaplex external metadata:', error);
                            }
                        }
                        
                        metadata = {
                            name: externalMetadata?.name || metadataAccount.name || metadata.name || '',
                            symbol: externalMetadata?.symbol || metadataAccount.symbol || metadata.symbol || '',
                            uri: metadataAccount.uri || metadata.uri || ''
                        };
                    }
                } catch (error) {
                    console.error('Error fetching Metaplex metadata:', error);
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

            console.log('Final Nifty Asset Data:', niftyAssetData);
            return niftyAssetData;
        } 
        catch (error) {
            console.error('Error in niftyAsset procedure:', error);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to fetch asset data',
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