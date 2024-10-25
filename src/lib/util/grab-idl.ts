import {
    PublicKey,
    Keypair,
    Connection,
    Transaction,
    VersionedTransaction,
} from "@solana/web3.js";
import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { getRPCUrl, getFallbackRPCUrl } from "./get-rpc-url";
import { idlStore } from "./stores/idl";

// Function to fetch IDL and update the store
export async function grabIdl(
    accountAddress: string,
    isMainnetValue: boolean
) {
    const network = isMainnetValue ? "mainnet" : "devnet";
    let index = 0;
    const getUrls = () => [getRPCUrl(network, index), getFallbackRPCUrl(network, index)];

    while (true) {
        const urls = getUrls();
        for (const url of urls) {
            try {
                const connection = new Connection(url, "confirmed");

                // Check if the account exists
                const accountInfo = await connection.getAccountInfo(new PublicKey(accountAddress));
                if (!accountInfo) {
                    console.error(`Account ${accountAddress} not found on ${url}`);
                    continue; // Try the next URL
                }
                const dummyKeypair = Keypair.generate();
                const dummyWallet = {
                    publicKey: dummyKeypair.publicKey,
                    signAllTransactions: <T extends Transaction | VersionedTransaction>(
                        txs: T[]
                    ): Promise<T[]> => Promise.resolve(txs),
                    signTransaction: <T extends Transaction | VersionedTransaction>(
                        tx: T
                    ): Promise<T> => Promise.resolve(tx),
                };

                const provider = new AnchorProvider(
                    connection,
                    dummyWallet,
                    AnchorProvider.defaultOptions()
                );

                const accountPubkey = new PublicKey(accountAddress);
                
                // Fetch the IDL
                const idl = await Program.fetchIdl(accountPubkey, provider);

                if (idl) {
                    // If IDL is successfully fetched, update the idlStore
                    idlStore.set(idl);
                    return idl;
                } else {
                    return { accountExists: true, hasIdl: false };
                }
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                console.error(`Error fetching IDL from ${url}:`, errorMessage);
                if (url === urls[urls.length - 1]) {
                    index++;
                    break; // Try the next set of URLs
                }
            }
        }
        if (index >= 3) break; // Add a maximum retry limit
    }

    return null;
}
