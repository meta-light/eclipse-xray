import { t } from "$lib/trpc/t";
import { z } from "zod";
import { getRPCUrl } from "$lib/util/get-rpc-url";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, AccountLayout } from "@solana/spl-token";

export const searchAssets = t.procedure
    .input(
        z.object({
            account: z.string(),
            cursor: z.number().optional(),
            isMainnet: z.boolean(),
            nativeBalance: z.boolean().optional(),
            tokenType: z.string().optional(),
        })
    )
    .query(async ({ input }) => {
        const {
            account,
            cursor = 1,
            isMainnet,
            nativeBalance = false,
        } = input;

        const connection = new Connection(getRPCUrl(isMainnet ? "mainnet" : "devnet"), "confirmed");
        const pubkey = new PublicKey(account);

        const [solBalance, tokenAccounts] = await Promise.all([
            nativeBalance ? connection.getBalance(pubkey) : Promise.resolve(null),
            connection.getTokenAccountsByOwner(pubkey, { programId: TOKEN_PROGRAM_ID }),
        ]);

        const tokens = tokenAccounts.value.map((ta) => {
            const accountInfo = AccountLayout.decode(ta.account.data);
            return {
                amount: accountInfo.amount.toString(),
                decimals: accountInfo.delegateOption ? accountInfo.delegate : 0,
                mint: new PublicKey(accountInfo.mint).toString(),
            };
        });

        return {
            nativeBalance: solBalance,
            page: cursor,
            tokens,
            total: tokens.length,
        };
    });