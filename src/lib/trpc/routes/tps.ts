import { t } from "$lib/trpc/t";
import { Connection } from "@solana/web3.js";
import { z } from "zod";
import { getRPCUrl } from "$lib/util/get-rpc-url";

export const tps = t.procedure.input(z.boolean()).query(async ({ input }) => {
    const connection = new Connection(getRPCUrl(input ? "mainnet" : "devnet"), "confirmed");
    const sampleCount = 5;
    const getRecentPerformanceSamples = async () => {
        const perfSamples = await connection.getRecentPerformanceSamples(sampleCount);
        return perfSamples.reduce((acc, sample) => acc + Number(sample.numTransactions) / sample.samplePeriodSecs, 0) / perfSamples.length;
    };
    const tps = await getRecentPerformanceSamples();
    return Math.round(tps);
});