import { t } from "$lib/trpc/t";
import { Connection, PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { getRPCUrl } from "$lib/util/get-rpc-url";
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

export interface NiftyAsset {
    mint: string;
    address: string;
    owner?: string;
    decimals: number;
    isNFT: boolean;
    supply: string;
    isToken2022: boolean;
    freezeAuthority?: string;
    mintAuthority?: string;
    metadata?: {
        symbol: string;
        name: string;
        uri: string;
    };
    externalMetadata?: {
        image?: string;
        description?: string;
        [key: string]: any;
    } | Record<string, never>;
}

async function fetchMetadataFromUri(uri: string): Promise<any> {
    const ipfsGateways = ['https://gateway.pinata.cloud/ipfs/', 'https://cloudflare-ipfs.com/ipfs/', 'https://ipfs.io/ipfs/'];
    if (uri.startsWith('ipfs://')) {
        const ipfsHash = uri.slice(7);
        for (const gateway of ipfsGateways) {
            try {
                const url = gateway + ipfsHash;
                const response = await axios.get(url, { timeout: 5000 });
                if (response.data) {return response.data;}
            } catch (error) {
                console.error(`Error fetching from ${gateway}:`, error instanceof Error ? error.message : String(error));
            }
        }
        console.error('Failed to fetch metadata from all IPFS gateways');
        return null;
    } else {
        try {
            const response = await axios.get(uri, { timeout: 5000 });
            if (response.data) {
                return response.data;
            }
        } catch (error) {
            console.error(`Error fetching metadata from URI: ${uri}`, error instanceof Error ? error.message : String(error));
        }
        return null;
    }
}

function parseToken2022Metadata(extensionData: Buffer): string | undefined {
    let stringData = extensionData.toString('utf8').replace(/\0/g, '');
    // Look for the IPFS URI and extract just the hash
    const ipfsUriRegex = /ipfs:\/\/(\w+)/;
    const ipfsUriMatch = stringData.match(ipfsUriRegex);

    if (ipfsUriMatch) {
        const [, ipfsHash] = ipfsUriMatch;
        const uri = `ipfs://${ipfsHash}`;
        return uri;
    }

    // If no IPFS URI found, try to find a standard HTTP(S) URI
    const httpUriRegex = /(https?:\/\/\S+)/;
    const httpUriMatch = stringData.match(httpUriRegex);

    if (httpUriMatch) {
        const [, uri] = httpUriMatch;
        return uri;
    }

    console.warn('No valid URI found');
    return undefined;
}

export const niftyAsset = t.procedure
    .input(z.tuple([z.string(), z.boolean()]))
    .query(async ({ input }): Promise<NiftyAsset> => {
        const [token, isMainnet] = input;

        try {
            let tokenPublicKey: PublicKey;
            try {
                tokenPublicKey = new PublicKey(token);
            } catch (error) {
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
            } catch (error) {
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
                const uri = parseToken2022Metadata(extensionData);
                if (uri) {
                    try {
                        externalMetadata = await fetchMetadataFromUri(uri);
                        if (externalMetadata) {
                            metadata = {
                                name: externalMetadata.name || '',
                                symbol: externalMetadata.symbol || '',
                                uri: uri,
                            };
                        } else {
                            console.warn('Failed to fetch external metadata');
                        }
                    } catch (error) {
                        console.error('Error fetching external metadata:', error);
                    }
                }
            } else {
                try {
                    const umiPublicKey = publicKey(tokenPublicKey.toBase58());
                    const [metadataPda] = findMetadataPda(umi, { mint: umiPublicKey });
                    const metadataAccount = await fetchMetadata(umi, metadataPda);
                    
                    if (metadataAccount) {
                        metadata = {
                            name: metadataAccount.name,
                            symbol: metadataAccount.symbol,
                            uri: metadataAccount.uri,
                        };
                        externalMetadata = {};
                        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
                        const uriLower = metadataAccount.uri.toLowerCase();
                        if (imageExtensions.some(ext => uriLower.endsWith(ext))) {
                            externalMetadata.image = metadataAccount.uri;
                        }
                    } else {
                        console.log('No metadata account found');
                    }
                } catch (error) {
                    console.error('Error fetching Metaplex metadata:', error);
                }
            }

            const niftyAssetData: NiftyAsset = {
                mint: token,
                address: token,
                decimals: mintInfo.decimals,
                isNFT,
                supply: mintInfo.supply.toString(),
                isToken2022,
                freezeAuthority: mintInfo.freezeAuthority?.toBase58(),
                mintAuthority: mintInfo.mintAuthority?.toBase58(),
                metadata,
                externalMetadata,
            };

            return niftyAssetData;
        } catch (error) {
            console.error("Error in nifty asset procedure:", error);
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Error fetching Nifty Asset data: ${error instanceof Error ? error.message : 'Unknown error'}`,
                cause: error,
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
    .input(z.object({
        account: z.string(),
        isMainnet: z.boolean(),
    }))
    .query(async ({ input }) => {
        const { account, isMainnet } = input;
        const network = isMainnet ? "mainnet" : "devnet";
        const connection = new Connection(getRPCUrl(network), "confirmed");
        const pubKey = new PublicKey(account);
        try {
            const tokenAccounts = await connection.getTokenAccountsByOwner(pubKey, {
                programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
            });
            const tokens = await Promise.all(tokenAccounts.value.map(async (tokenAccount) => {
                const accountInfo = await connection.getParsedAccountInfo(tokenAccount.pubkey);
                const tokenInfo = (accountInfo.value?.data as any)?.parsed?.info;

                if (tokenInfo) {
                    return {
                        mint: tokenInfo.mint,
                        tokenAccount: tokenAccount.pubkey.toBase58(),
                        amount: tokenInfo.tokenAmount.uiAmount,
                        decimals: tokenInfo.tokenAmount.decimals,
                        isNFT: tokenInfo.tokenAmount.decimals === 0 && tokenInfo.tokenAmount.uiAmount === 1
                    };
                }
                return null;
            }));

            const filteredTokens = tokens.filter((token): token is NonNullable<typeof token> => token !== null);
            console.log('All tokens in the wallet:', filteredTokens);
            return filteredTokens;
        } catch (error) {
            console.error("Error fetching tokens:", error);
            throw new Error("Failed to fetch tokens");
        }
    });
