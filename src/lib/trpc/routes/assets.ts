import { t } from "$lib/trpc/t";
import { Connection, PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { getRPCUrl } from "$lib/util/get-rpc-url";
import { TOKEN_PROGRAM_ID, AccountLayout } from "@solana/spl-token";

export const assets = t.procedure
    .input(
        z.object({
            account: z.string(),
            cursor: z.number().optional(),
            isMainnet: z.boolean(),
        })
    )
    .query(async ({ input }) => {
        const connection = new Connection(getRPCUrl(input.isMainnet ? "mainnet" : "devnet"), "confirmed");
        const pubkey = new PublicKey(input.account);
        const tokenAccounts = await connection.getTokenAccountsByOwner(pubkey, {programId: TOKEN_PROGRAM_ID});
        const assets = tokenAccounts.value.map((ta) => {
            const accountInfo = AccountLayout.decode(ta.account.data);
            return {
                amount: accountInfo.amount.toString(),
                decimals: accountInfo.delegateOption ? accountInfo.delegate : 0,
                mint: new PublicKey(accountInfo.mint).toString(),
            };
        });

        return {assets, total: assets.length};
    });