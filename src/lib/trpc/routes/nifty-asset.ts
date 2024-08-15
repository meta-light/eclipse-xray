import { z } from "zod";
import { t } from "$lib/trpc/t";
import { Connection, PublicKey } from "@solana/web3.js";
import { getRPCUrl } from "$lib/util/get-rpc-url";
import { TRPCError } from '@trpc/server';
import { TOKEN_PROGRAM_ID, getAccount, getMint } from "@solana/spl-token";

export const niftyAsset = t.procedure
    .input(z.tuple([z.string(), z.boolean()]))
    .query(async ({ input }) => {
        const [address, isMainnet] = input;
        console.log(`Fetching nifty asset data for ${address} on ${isMainnet ? 'mainnet' : 'devnet'}`);

        try {
            const connection = new Connection(getRPCUrl(isMainnet ? "mainnet" : "devnet"), "confirmed");
            const publicKey = new PublicKey(address);

            // First, try to get the token account info
            let tokenAccountInfo;
            try {
                tokenAccountInfo = await getAccount(connection, publicKey);
            } catch (error) {
                console.log("Not a token account, trying as a mint...");
            }

            let nftData: {
                address: string;
                mint: string;
                owner?: string;
                amount?: string;
                supply?: string;
                decimals: number;
                metadata?: any;
            };

            if (tokenAccountInfo) {
                // It's a token account, get the associated mint
                const mintInfo = await getMint(connection, tokenAccountInfo.mint);
                nftData = {
                    address: address,
                    mint: tokenAccountInfo.mint.toBase58(),
                    owner: tokenAccountInfo.owner.toBase58(),
                    amount: tokenAccountInfo.amount.toString(),
                    decimals: mintInfo.decimals,
                };
            } else {
                // It might be a mint account
                try {
                    const mintInfo = await getMint(connection, publicKey);
                    nftData = {
                        address: address,
                        mint: address,
                        supply: mintInfo.supply.toString(),
                        decimals: mintInfo.decimals,
                    };
                } catch (error) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'NFT not found. The address is neither a valid token account nor a mint.',
                    });
                }
            }

            // Fetch metadata (simplified, as we can't use nifty-oss)
            const metadataPDA = await getMetadata(new PublicKey(nftData.mint));
            const metadataInfo = await connection.getAccountInfo(metadataPDA);
            if (metadataInfo) {
                nftData.metadata = decodeMetadata(metadataInfo.data);
            }

            return nftData;
        } catch (error) {
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Error fetching nifty asset data: ${error instanceof Error ? error.message : 'Unknown error'}`,
                cause: error,
            });
        }
    });

// Helper functions for metadata (simplified)
async function getMetadata(mint: PublicKey): Promise<PublicKey> {
    const [publicKey] = await PublicKey.findProgramAddress(
        [
            Buffer.from("metadata"),
            new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
            mint.toBuffer(),
        ],
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    );
    return publicKey;
}

function decodeMetadata(buffer: Buffer): any {
    // Simplified metadata decoding
    // You'll need to implement proper decoding based on your metadata structure
    return {
        name: buffer.toString('utf8', 0, 32).replace(/\0/g, ''),
        symbol: buffer.toString('utf8', 32, 64).replace(/\0/g, ''),
        uri: buffer.toString('utf8', 64, 200).replace(/\0/g, ''),
    };
}

export const nfts = t.procedure
    .input(z.object({
        account: z.string(),
        isMainnet: z.boolean(),
    }))
    .query(async ({ input }) => {
        const { account, isMainnet } = input;
        const network = isMainnet ? "mainnet" : "devnet";
        const connection = new Connection(getRPCUrl(network), "confirmed");
        const pubKey = new PublicKey(account);

        try {
            // Fetch all token accounts
            const tokenAccounts = await connection.getTokenAccountsByOwner(pubKey, {
                programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
            });

            const tokens = await Promise.all(tokenAccounts.value.map(async (tokenAccount) => {
                const accountInfo = await connection.getParsedAccountInfo(tokenAccount.pubkey);
                const tokenInfo = (accountInfo.value?.data as any)?.parsed?.info;

                if (tokenInfo) {
                    return {
                        mint: tokenInfo.mint,
                        tokenAccount: tokenAccount.pubkey.toBase58(),
                        amount: tokenInfo.tokenAmount.uiAmount,
                        decimals: tokenInfo.tokenAmount.decimals,
                        isNFT: tokenInfo.tokenAmount.decimals === 0 && tokenInfo.tokenAmount.uiAmount === 1
                    };
                }
                return null;
            }));

            const filteredTokens = tokens.filter(token => token !== null);
            console.log('All tokens in the wallet:', filteredTokens);
            return filteredTokens;
        } catch (error) {
            console.error("Error fetching tokens:", error);
            throw new Error("Failed to fetch tokens");
        }
    });