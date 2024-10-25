import { z } from "zod";
import { t } from "$lib/trpc/t";
import { getRPCUrl, getFallbackRPCUrl } from "$lib/util/get-rpc-url";
import { Connection } from "@solana/web3.js";

export const rawTransaction = t.procedure
    .input(
        z.object({
            transaction: z.string(),
            network: z.enum(["mainnet", "devnet"])
        })
    )
    .query(async ({ input, ctx }) => {
        const { transaction, network } = input;
        
        let index = 0;
        let rpcUrl = getRPCUrl(network, index);
        let fallbackRpcUrl = getFallbackRPCUrl(network, index);
        
        const connection = new Connection(rpcUrl, "confirmed");
        
        try {
            const txSignature = transaction;
            let tx = await connection.getTransaction(txSignature, {
                maxSupportedTransactionVersion: 0,
            });

            while (!tx && index < 3) { // Retry up to 3 times
                index++;
                rpcUrl = getRPCUrl(network, index);
                fallbackRpcUrl = getFallbackRPCUrl(network, index);

                const retryConnection = new Connection(rpcUrl, "confirmed");
                tx = await retryConnection.getTransaction(txSignature, {
                    maxSupportedTransactionVersion: 0,
                });
            }

            if (!tx) {
                // If the primary RPC fails, try the fallback
                const fallbackConnection = new Connection(fallbackRpcUrl, "confirmed");
                const fallbackTx = await fallbackConnection.getTransaction(txSignature, {
                    maxSupportedTransactionVersion: 0,
                });

                if (!fallbackTx) {
                    throw new Error("Transaction not found");
                }

                return fallbackTx;
            }

            return tx;
        } catch (error) {
            console.error("Error fetching raw transaction:", error);
            throw error;
        }
    });
