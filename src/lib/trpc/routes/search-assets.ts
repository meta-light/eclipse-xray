import { t } from "$lib/trpc/t";
import { z } from "zod";
import { getRPCUrl } from "$lib/utils";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, AccountLayout, getMint } from "@solana/spl-token";

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


        const tokens = await Promise.all(tokenAccounts.value.map(async (ta) => {
            const accountInfo = AccountLayout.decode(ta.account.data);
            const mintPubkey = new PublicKey(accountInfo.mint);
            const mintInfo = await getMint(connection, mintPubkey);
            
            return {
                id: mintPubkey.toString(),
                balance: Number(accountInfo.amount),
                decimals: mintInfo.decimals,
                token_info: {
                    balance: Number(accountInfo.amount),
                    decimals: mintInfo.decimals,
                    token_program_id: TOKEN_PROGRAM_ID.toString(),
                    price_info: { price_per_token: 0 },
                },
            };
        }));

        return {
            nativeBalance: solBalance,
            page: cursor,
            tokens,
            total: tokens.length,
        };
    });