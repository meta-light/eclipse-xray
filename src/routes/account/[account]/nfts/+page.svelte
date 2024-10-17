<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from 'svelte';
    import { getRPCUrl } from "$lib/util/get-rpc-url";
    import { Connection, PublicKey } from "@solana/web3.js";
    import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, AccountLayout } from "@solana/spl-token";
    import TokenProvider from "$lib/components/providers/token-provider.svelte";

    const { account } = $page.params;
    const params = new URLSearchParams(window.location.search);
    const network = params.get("network");
    const isMainnetValue = network !== "devnet";
    let nfts: any[] = [];
    let fetchError: string | null = null;

    async function fetchAccountData() {
        const rpcUrl = getRPCUrl(isMainnetValue ? "mainnet" : "devnet");
        const connection = new Connection(rpcUrl, "confirmed");
        const pubkey = new PublicKey(account);

        try {
            const [splTokenAccounts, token2022Accounts] = await Promise.all([
                connection.getTokenAccountsByOwner(pubkey, { programId: TOKEN_PROGRAM_ID }),
                connection.getTokenAccountsByOwner(pubkey, { programId: TOKEN_2022_PROGRAM_ID }),
            ]);

            const allTokenAccounts = [...splTokenAccounts.value, ...token2022Accounts.value];

            nfts = await Promise.all(allTokenAccounts.map(async (ta) => {
                const data = new Uint8Array(ta.account.data);
                const accountInfo = AccountLayout.decode(data);
                const mintPubkey = new PublicKey(accountInfo.mint);
                
                try {
                    const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
                    const decimals = (mintInfo.value?.data as any)?.parsed?.info?.decimals || 0;
                    const balance = Number(accountInfo.amount);

                    // Only return tokens with 0 decimals and balance of 1 (NFTs)
                    if (decimals === 0 && balance === 1) {
                        return {
                            mint: mintPubkey.toString(),
                            tokenAccount: ta.pubkey.toString(),
                            balance: balance,
                            decimals: decimals,
                            isToken2022: ta.account.owner.equals(TOKEN_2022_PROGRAM_ID),
                        };
                    }
                    return null;
                } catch (error) {
                    console.error(`Error processing token account:`, error);
                    return null;
                }
            }));

            // Filter out any null values from failed token account processing
            nfts = nfts.filter(nft => nft !== null);

        } catch (error) {
            console.error("Error fetching account data:", error);
            fetchError = error instanceof Error ? error.message : String(error);
        }
    }

    onMount(fetchAccountData);
</script>

<div class="container mx-auto px-4">
    <h2 class="text-2xl font-bold mb-4">Account NFTs</h2>
    {#if fetchError}
        <p class="text-red-500">Error loading NFTs: {fetchError}</p>
    {:else if nfts.length === 0}
        <p>No NFTs found for this account.</p>
    {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {#each nfts as nft}
                <TokenProvider address={nft.mint}>
                    <div slot="default" let:metadata let:tokenIsLoading let:tokenFailed>
                        {#if tokenIsLoading}
                            <div class="animate-pulse bg-gray-200 aspect-square rounded"></div>
                        {:else if tokenFailed}
                            <div class="bg-red-100 p-4 rounded aspect-square flex items-center justify-center">
                                <span class="text-red-500">Failed to load NFT data</span>
                            </div>
                        {:else}
                            <a href="/token/{nft.mint}?network={isMainnetValue ? 'mainnet' : 'devnet'}" class="block">
                                <div class="bg-white shadow rounded-lg overflow-hidden">
                                    {#if metadata.image}
                                        <img src={metadata.image} alt={metadata.name} class="w-full aspect-square object-cover">
                                    {:else}
                                        <div class="w-full aspect-square bg-gray-200 flex items-center justify-center">
                                            <span class="text-gray-500 text-sm">No Image</span>
                                        </div>
                                    {/if}
                                    <div class="p-4">
                                        <h3 class="font-semibold truncate">{metadata.name || "Unnamed NFT"}</h3>
                                        <p class="text-sm text-gray-500 truncate">{nft.mint.slice(0, 4)}...{nft.mint.slice(-4)}</p>
                                    </div>
                                </div>
                            </a>
                        {/if}
                    </div>
                </TokenProvider>
            {/each}
        </div>
    {/if}
</div>