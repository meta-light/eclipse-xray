import { t } from "$lib/trpc/t";
import { getRPCUrl } from "$lib/utils";
import { ConcurrentMerkleTreeAccount } from "@solana/spl-account-compression";
import { PublicKey, Connection } from "@solana/web3.js";
import { z } from "zod";

export const concurrentMerkleTree = t.procedure
    .input(z.object({ address: z.string(), isMainnet: z.boolean() }))
    .query(async ({ input }) => {
        const connection = new Connection(getRPCUrl(input.isMainnet ? "mainnet" : "devnet"), "confirmed");
        const pubkey = new PublicKey(input.address);
        const cmt = await ConcurrentMerkleTreeAccount.fromAccountAddress(connection, pubkey);
        const authority = cmt.getAuthority();
        const root = cmt.getCurrentRoot();
        const seq = cmt.getCurrentSeq().toString();
        const canopyDepth = cmt.getCanopyDepth();
        const maxBufferSize = cmt.getMaxBufferSize();
        const treeHeight = cmt.getMaxDepth();
        const creationSlot = cmt.getCreationSlot().toNumber();
        const rightMostIndex = cmt.tree.rightMostPath.index;
        return {authority, canopyDepth, creationSlot, maxBufferSize, rightMostIndex, root, seq, treeHeight};
    });