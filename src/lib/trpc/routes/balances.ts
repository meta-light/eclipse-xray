import { t } from "$lib/trpc/t";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, AccountLayout } from "@solana/spl-token";
import { z } from "zod";
import { getRPCUrl } from "$lib/utils";

export const balances = t.procedure
    .input(z.tuple([z.string(), z.boolean()]))
    .query(async ({ input }) => {
        const [account, isMainnet] = input;
        const connection = new Connection(getRPCUrl(isMainnet ? "mainnet" : "devnet"), "confirmed");
        const pubkey = new PublicKey(account);
        const [solBalance, tokenAccounts] = await Promise.all([connection.getBalance(pubkey), connection.getTokenAccountsByOwner(pubkey, { programId: TOKEN_PROGRAM_ID })]);
        const tokens = tokenAccounts.value.map((ta) => {
            const accountInfo = AccountLayout.decode(ta.account.data);
            return {amount: accountInfo.amount.toString(), decimals: accountInfo.delegateOption ? accountInfo.delegate : 0, mint: new PublicKey(accountInfo.mint).toString()};
        });
        return {nativeBalance: solBalance, tokens,};
    });