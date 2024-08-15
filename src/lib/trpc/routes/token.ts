import { t } from "$lib/trpc/t";
import { Connection, PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { getRPCUrl } from "$lib/util/get-rpc-url";
import { getMint, getAccount, Mint, TransferFeeConfig } from "@solana/spl-token";
import { TRPCError } from '@trpc/server';

const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

export const token = t.procedure
    .input(z.tuple([z.string(), z.boolean()]))
    .query(async ({ input }) => {
        const [token, isMainnet] = input;
        console.log(`Fetching token data for ${token} on ${isMainnet ? 'mainnet' : 'devnet'}`);

        try {
            const connection = new Connection(getRPCUrl(isMainnet ? "mainnet" : "devnet"), "confirmed");
            const tokenPublicKey = new PublicKey(token);

            const accountInfo = await connection.getAccountInfo(tokenPublicKey);
            if (!accountInfo) {
                throw new Error("Token account not found");
            }

            const isToken2022 = accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID);

            let tokenData;
            if (isToken2022) {
                // Handle Token-2022
                const mintInfo = await getMint(connection, tokenPublicKey, undefined, TOKEN_2022_PROGRAM_ID) as Mint & {
                    transferFeeConfig?: TransferFeeConfig;
                };
                tokenData = {
                    address: token,
                    decimals: mintInfo.decimals,
                    supply: mintInfo.supply.toString(),
                    isToken2022: true,
                    extensions: {
                        transferFeeConfig: mintInfo.transferFeeConfig,
                    },
                };
            } else {
                // Handle regular SPL tokens
                const mintInfo = await getMint(connection, tokenPublicKey);
                tokenData = {
                    address: token,
                    decimals: mintInfo.decimals,
                    supply: mintInfo.supply.toString(),
                    isToken2022: false,
                };
            }

            console.log("Token data:", tokenData);
            return tokenData;
        } catch (error) {
            console.error("Error in token procedure:", error);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Error fetching token data: ${error instanceof Error ? error.message : 'Unknown error'}`,
                cause: error,
            });
        }
    });