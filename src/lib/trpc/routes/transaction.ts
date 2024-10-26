import { t } from "$lib/trpc/t";
import { Connection } from "@solana/web3.js";
import { z } from "zod";
import { getRPCUrl } from "$lib/utils";

export const transaction = t.procedure
    .input(
        z.object({
            isMainnet: z.boolean(),
            transaction: z.string(),
        })
    )
    .query(async ({ input }) => {
        try {
            const connection = new Connection(getRPCUrl(input.isMainnet ? "mainnet" : "devnet"), "confirmed");
            const signature = input.transaction;

            const transaction = await connection.getTransaction(signature, {
                maxSupportedTransactionVersion: 0,
            });

            if (!transaction) {
                return { data: null, error: "Transaction not found" };
            }

            return {
                blockTime: transaction.blockTime,

                meta: transaction.meta,
                slot: transaction.slot,
                transaction: transaction.transaction,

            };
        } catch (error) {
            return { data: null, error: "Server error" };
        }
    });