import { z } from "zod";
import { t } from "$lib/trpc/t";
import { LAMPORTS_PER_SOL, PublicKey, Connection } from "@solana/web3.js";
import { getRPCUrl } from "$lib/utils";

export const accountInfo = t.procedure
    .input(z.tuple([z.string(), z.literal("mainnet").or(z.literal("devnet"))]))
    .query(async ({ input }) => {
        const [address, network] = input;
        const connection = new Connection(getRPCUrl(network), "confirmed");
        const pubKey = new PublicKey(address);
        const accountInfo = await connection.getParsedAccountInfo(pubKey);
        return {...accountInfo, balance: (accountInfo?.value?.lamports || 0) / LAMPORTS_PER_SOL};
    });
