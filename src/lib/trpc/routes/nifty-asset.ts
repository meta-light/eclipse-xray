import { t } from "$lib/trpc/t";
import { z } from "zod";
import { getRPCUrl } from "$lib/util/get-rpc-url";
import { Connection, PublicKey } from "@solana/web3.js";
import { TRPCError } from '@trpc/server';
import { MINT_SIZE, MintLayout } from "@solana/spl-token";
import { Buffer } from 'buffer';
import axios from 'axios';

const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export const niftyAsset = t.procedure
    .input(z.tuple([z.string(), z.boolean()]))
    .query(async ({ input }) => {
        const [token, isMainnet] = input;
        console.log(`Fetching Token-2022 NFT data for ${token} on ${isMainnet ? 'mainnet' : 'devnet'}`);

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

            const url = getRPCUrl(isMainnet ? "mainnet" : "devnet");
            const connection = new Connection(url, "confirmed");
            const accountInfo = await connection.getAccountInfo(tokenPublicKey);

            if (!accountInfo) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `Token account not found for address: ${token}`,
                });
            }

            const isToken2022 = accountInfo.owner.toBase58() === TOKEN_2022_PROGRAM_ID;

            if (!isToken2022) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Invalid token account: ${token}. Not owned by Token-2022 program.`,
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

            const isNFT = mintInfo.decimals === 0 && mintInfo.supply.toString() === '1';

            if (!isNFT) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Invalid NFT: ${token}. Supply must be 1 and decimals must be 0.`,
                });
            }

            let metadata;
            let extendedMetadata;
            const extensionData = accountInfo.data.slice(MINT_SIZE);
            const metadataOffset = extensionData.indexOf(Buffer.from([0x04, 0x00, 0x00, 0x00])); // Metadata type identifier
            if (metadataOffset !== -1) {
                const nameLength = extensionData.readUInt32LE(metadataOffset + 4);
                const name = extensionData.slice(metadataOffset + 8, metadataOffset + 8 + nameLength).toString('utf8');
                const symbolOffset = metadataOffset + 8 + nameLength;
                const symbolLength = extensionData.readUInt32LE(symbolOffset);
                const symbol = extensionData.slice(symbolOffset + 4, symbolOffset + 4 + symbolLength).toString('utf8');
                const uriOffset = symbolOffset + 4 + symbolLength;
                const uriLength = extensionData.readUInt32LE(uriOffset);
                const uri = extensionData.slice(uriOffset + 4, uriOffset + 4 + uriLength).toString('utf8');

                metadata = { name, symbol, uri };

                // Fetch extended metadata from URI
                try {
                    const response = await axios.get(uri);
                    extendedMetadata = response.data;
                } catch (error) {
                    console.error("Error fetching extended metadata:", error);
                }
            }

            const nftData = {
                address: token,
                mint: token,
                decimals: mintInfo.decimals,
                supply: mintInfo.supply.toString(),
                isToken2022: true,
                isNFT: true,
                freezeAuthority: mintInfo.freezeAuthority?.toBase58(),
                mintAuthority: mintInfo.mintAuthority?.toBase58(),
                metadata: metadata || undefined,
                extendedMetadata: extendedMetadata || undefined,
            };

            return nftData;
        } catch (error) {
            console.error("Error in nifty asset procedure:", error);
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Error fetching Token-2022 NFT data: ${error instanceof Error ? error.message : 'Unknown error'}`,
                cause: error,
            });
        }
    });

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
            // Fetch all token accounts
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
