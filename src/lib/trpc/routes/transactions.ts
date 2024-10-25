import { t } from "$lib/trpc/t";
import { Connection, PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { getRPCUrl } from "$lib/utils";

export const transactions = t.procedure
    .input(
        z.object({
            account: z.string(),
            cursor: z.string().optional(),
            isMainnet: z.boolean(),
        })
    )
    .query(async ({ input }) => {
        const connection = new Connection(getRPCUrl(input.isMainnet ? "mainnet" : "devnet"), "confirmed");
        const pubkey = new PublicKey(input.account);

        const signatures = await connection.getSignaturesForAddress(pubkey, {
            before: input.cursor,
            limit: 20,
        });

        if (signatures.length === 0) {
            return {
                oldest: "",
                result: [],
            };
        }

        const transactions = await Promise.all(
            signatures.map(async (sig) => {
                try {
                    const tx = await connection.getTransaction(sig.signature, {
                        maxSupportedTransactionVersion: 0,
                    });
                    return {
                        blockTime: tx?.blockTime,
                        err: tx?.meta?.err,
                        signature: sig.signature,
                        slot: tx?.slot,
                    };
                } catch (error) {
                    return null;
                }
            })
        );

        const result = transactions.filter((tx): tx is NonNullable<typeof tx> => tx !== null);

        return {
            oldest: signatures[signatures.length - 1]?.signature || "",
            result,
        };
    });