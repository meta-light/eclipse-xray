//@ts-nocheck
import type { EnrichedTransaction } from "helius-sdk";

import { t } from "$lib/trpc/t";
import { z } from "zod";

import { parseTransaction } from "$lib/xray";

import {
    VOTE_PROGRAM_ID,
    type ConfirmedTransactionMeta,
    type TransactionSignature,
    Connection,
} from "@solana/web3.js";
import { getRPCUrl } from "$lib/util/get-rpc-url";

import { HELIUS_API_KEY } from "$env/static/private";

type TransactionWithInvocations = {
    index: number;
    signature?: TransactionSignature | undefined;
    meta: ConfirmedTransactionMeta | null;
    invocations: Map<string, number>;
};

const voteFilter = VOTE_PROGRAM_ID.toBase58();

export const blockTransactions = t.procedure
    .input(
        z.object({
            cursor: z.string().optional(),
            isMainnet: z.boolean(),
            limit: z.number().min(1).max(100).optional(),
            slot: z.number(),
        })
    )
    .query(async ({ input }) => {
        const connection = new Connection(
            getRPCUrl(input.isMainnet ? "mainnet" : "devnet"),
            "confirmed"
        );

        const block = await connection.getBlock(input.slot, {
            maxSupportedTransactionVersion: 0,
        });

        if (!block) {
            throw new Error("Block not found");
        }

        const transactions = block.transactions.map((tx, index) => {
            const { transaction, meta } = tx;
            return {
                err: meta?.err,
                fee: meta?.fee,
                index,
                signature: transaction.signatures[0],
                slot: block.parentSlot,
            };
        });

        return {
            blockHeight: block.blockHeight,
            blockTime: block.blockTime,
            transactions,
        };
    });