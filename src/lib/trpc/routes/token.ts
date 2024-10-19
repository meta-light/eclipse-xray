import { t } from "$lib/trpc/t";
import { Connection, PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { getRPCUrl } from "$lib/util/get-rpc-url";
import { MintLayout } from "@solana/spl-token";
import { TRPCError } from '@trpc/server';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { Umi } from '@metaplex-foundation/umi';
import { MINT_SIZE } from "@solana/spl-token";
import { Buffer } from 'buffer';
import axios from 'axios';

const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const TOKEN_PROGRAM_ID = "";

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
  };
  externalMetadata?: any; // We use 'any' here as the structure might vary
}

async function fetchMetadataFromUri(uri: string): Promise<any> {
  try {
    const response = await axios.get(uri);
    return response.data;
  } catch (error) {
    console.error(`Error fetching metadata from URI: ${uri}`, error);
    return null;
  }
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
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Invalid token account: ${token}. Not owned by Token or Token-2022 program.`,
                });
            }

            const decodedMintInfo = MintLayout.decode(accountInfo.data);
            const mintInfo = {
                mintAuthority: decodedMintInfo.mintAuthority,
                supply: decodedMintInfo.supply,
                decimals: decodedMintInfo.decimals,
                isInitialized: decodedMintInfo.isInitialized,
                freezeAuthority: decodedMintInfo.freezeAuthority,
            };

            let metadata;
            let externalMetadata;
            if (isToken2022) {
                const extensionData = accountInfo.data.slice(MINT_SIZE);
                const metadataOffset = extensionData.indexOf(Buffer.from('USD Coin'));
                if (metadataOffset !== -1) {
                    const nameLength = extensionData.readUInt32LE(metadataOffset - 4);
                    const name = extensionData.slice(metadataOffset, metadataOffset + nameLength).toString('utf8');
                    const symbolOffset = metadataOffset + nameLength;
                    const symbolLength = extensionData.readUInt32LE(symbolOffset);
                    const symbol = extensionData.slice(symbolOffset + 4, symbolOffset + 4 + symbolLength).toString('utf8');
                    const uriOffset = symbolOffset + 4 + symbolLength;
                    const uriLength = extensionData.readUInt32LE(uriOffset);
                    const uri = extensionData.slice(uriOffset + 4, uriOffset + 4 + uriLength).toString('utf8');

                    metadata = { name, symbol, uri, };
                    
                    // Fetch external metadata from URI
                    if (uri) {
                        externalMetadata = await fetchMetadataFromUri(uri);
                    }
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
                externalMetadata: externalMetadata || undefined,
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
