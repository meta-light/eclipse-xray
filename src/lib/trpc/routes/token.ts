import { t } from "$lib/trpc/t";
import { Connection, PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { getRPCUrl } from "$lib/utils";
import { MintLayout } from "@solana/spl-token";
import { TRPCError } from '@trpc/server';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { Umi } from '@metaplex-foundation/umi';
import { Buffer } from 'buffer';
import axios from 'axios';
import { ACCOUNT_SIZE } from "@solana/spl-token";
import { findMetadataPda } from '@metaplex-foundation/mpl-token-metadata';
import { fetchMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "$lib/config";

export interface TokenData {
  address: string;
  decimals: number;
  supply: string;
  isToken2022: boolean;
  freezeAuthority?: string;
  mintAuthority?: string;
  metadata?: {
    name: string;
    symbol: string;
    uri: string;
    image?: string;
  };
  externalMetadata?: {
    image?: string;
    description?: string;
    [key: string]: any;
  } | Record<string, never> | null;
}

async function fetchMetadataFromUri(uri: string): Promise<any> {
    const ipfsGateways = ['https://gateway.pinata.cloud/ipfs/', 'https://cloudflare-ipfs.com/ipfs/', 'https://ipfs.io/ipfs/'];
    if (uri.startsWith('ipfs://')) {
        const ipfsHash = uri.slice(7);
        for (const gateway of ipfsGateways) {
            try {
                const url = gateway + ipfsHash;
                const response = await axios.get(url, { timeout: 5000 });
                if (response.data) {
                    return response.data;
                }
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
            if (axios.isAxiosError(error) && error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
        }
        return null;
    }
}

function parseToken2022Metadata(extensionData: Buffer): string | undefined {
    let stringData = extensionData.toString('utf8').replace(/\0/g, '');
    const ipfsUriRegex = /ipfs:\/\/(\w+)/;
    const ipfsUriMatch = stringData.match(ipfsUriRegex);
    if (ipfsUriMatch) {
        const [, ipfsHash] = ipfsUriMatch;
        const uri = `ipfs://${ipfsHash}`;
        return uri;
    }
    const httpUriRegex = /(https?:\/\/\S+)/;
    const httpUriMatch = stringData.match(httpUriRegex);
    if (httpUriMatch) {
        const [, uri] = httpUriMatch;
        return uri;
    }
    console.warn('No valid URI found');
    return undefined;
}

export const token = t.procedure
    .input(z.tuple([z.string(), z.boolean()]))
    .query(async ({ input }): Promise<TokenData> => {
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
                        
                        // Check if the URI is a direct image link or JSON metadata
                        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
                        const uriLower = metadataAccount.uri.toLowerCase();
                        
                        if (imageExtensions.some(ext => uriLower.endsWith(ext))) {
                            // URI is a direct image link
                            externalMetadata = {
                                image: metadataAccount.uri,
                                name: metadataAccount.name,
                                symbol: metadataAccount.symbol,
                            };
                        } else {
                            // Attempt to fetch JSON metadata
                            externalMetadata = await fetchMetadataFromUri(metadataAccount.uri);
                        }

                        if (!externalMetadata) {
                            console.warn('Failed to fetch or parse external metadata from URI:', metadataAccount.uri);
                            // Fallback to on-chain data
                            externalMetadata = {
                                name: metadataAccount.name,
                                symbol: metadataAccount.symbol,
                            };
                        }
                    } else {
                        // Attempt to parse metadata from the token account data
                        const parsedMetadata = parseTokenAccountMetadata(accountInfo.data);
                        if (parsedMetadata) {
                            metadata = parsedMetadata;
                            // Check if the parsed URI is a direct image link
                            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
                            const uriLower = parsedMetadata.uri.toLowerCase();
                            
                            if (imageExtensions.some(ext => uriLower.endsWith(ext))) {
                                externalMetadata = {
                                    image: parsedMetadata.uri,
                                    name: parsedMetadata.name,
                                    symbol: parsedMetadata.symbol,
                                };
                            } else {
                                externalMetadata = await fetchMetadataFromUri(parsedMetadata.uri);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error fetching or parsing metadata:', error);
                }
            }

            const tokenData: TokenData = {
                address: token,
                decimals: mintInfo.decimals,
                supply: mintInfo.supply.toString(),
                isToken2022,
                freezeAuthority: mintInfo.freezeAuthority?.toBase58(),
                mintAuthority: mintInfo.mintAuthority?.toBase58(),
                metadata: metadata || undefined,
                externalMetadata: externalMetadata,
            };

            return tokenData;
        } catch (error) {
            console.error("Error in token procedure:", error);
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Error fetching token data: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

// Helper function to parse metadata from token account data
function parseTokenAccountMetadata(data: Buffer): { name: string; symbol: string; uri: string } | null {
    try {
        const nameLength = data[0];
        const name = data.slice(1, 1 + nameLength).toString('utf8').replace(/\0/g, '');
        
        const symbolLength = data[1 + nameLength];
        const symbol = data.slice(1 + nameLength + 1, 1 + nameLength + 1 + symbolLength).toString('utf8').replace(/\0/g, '');
        
        const uriLength = data.readUInt16LE(1 + nameLength + 1 + symbolLength);
        const uri = data.slice(1 + nameLength + 1 + symbolLength + 2, 1 + nameLength + 1 + symbolLength + 2 + uriLength).toString('utf8').replace(/\0/g, '');
        
        return { name, symbol, uri };
    } catch (error) {
        console.error('Error parsing token account metadata:', error);
        return null;
    }
}