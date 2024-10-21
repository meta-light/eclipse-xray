<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { getRPCUrl } from "$lib/util/get-rpc-url";
    import { Connection, PublicKey } from "@solana/web3.js";
    import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, AccountLayout } from "@solana/spl-token";
    import TokenProvider from "$lib/components/providers/token-provider.svelte";
    import { trpcWithQuery } from "$lib/trpc/client";

    const account = $page.params.account;
    const client = trpcWithQuery($page);
    
    let allTokens: any[] = [];
    let nfts: any[] = [];
    let fetchError: string | null = null;
    let isLoading = true;

    const isMainnetValue = $page.url.searchParams.get("network") !== "devnet";

    async function fetchAccountData() {
        isLoading = true;
        const rpcUrl = getRPCUrl(isMainnetValue ? "mainnet" : "devnet");
        const connection = new Connection(rpcUrl, "confirmed");
        const pubkey = new PublicKey(account);
        try {
            const [splTokenAccounts, token2022Accounts] = await Promise.all([
                connection.getTokenAccountsByOwner(pubkey, { programId: TOKEN_PROGRAM_ID }),
                connection.getTokenAccountsByOwner(pubkey, { programId: TOKEN_2022_PROGRAM_ID }),
            ]);

            const allTokenAccounts = [...splTokenAccounts.value, ...token2022Accounts.value];

            allTokens = await Promise.all(allTokenAccounts.map(async (ta) => {
                const data = new Uint8Array(ta.account.data);
                const accountInfo = AccountLayout.decode(data);
                const mintPubkey = new PublicKey(accountInfo.mint);
                
                
                return {
                    mint: mintPubkey.toString(),
                    tokenAccount: ta.pubkey.toString(),
                    balance: Number(accountInfo.amount),
                    isToken2022: ta.account.owner.equals(TOKEN_2022_PROGRAM_ID),
                };
            }));


            // Fetch token data directly from the connection
            nfts = await Promise.all(allTokens.map(async (token) => {
                try {
                    const mintInfo = await connection.getParsedAccountInfo(new PublicKey(token.mint));
                    
                    if (mintInfo.value && 'parsed' in mintInfo.value.data) {
                        const parsedData = mintInfo.value.data.parsed;
                        if ('info' in parsedData && 'decimals' in parsedData.info) {
                            const decimals = parsedData.info.decimals;
                            return decimals === 0 ? { ...token, decimals } : null;
                        }
                    }
                    console.warn(`Unexpected mint info structure for ${token.mint}`);
                    return null;
                } catch (error) {
                    console.error(`Error fetching mint info for ${token.mint}:`, error);
                    return null;
                }
            }));
            nfts = nfts.filter(nft => nft !== null);


        } catch (error) {
            console.error("Error fetching account data:", error);
            fetchError = error instanceof Error ? error.message : String(error);
        } finally {
            isLoading = false;
        }
    }

    onMount(fetchAccountData);
</script>

<div class="container mx-auto px-4">
    <h2 class="text-2xl font-bold mb-4">Account NFTs</h2>
    {#if isLoading}
        <p>Loading...</p>
    {:else if fetchError}
        <p class="text-red-500">Error loading NFTs: {fetchError}</p>
    {:else if nfts.length === 0}
        <p>No NFTs found for this account.</p>
    {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {#each nfts as nft (nft.mint)}
                <TokenProvider address={nft.mint}>
                    <div slot="default" let:metadata let:tokenIsLoading let:tokenFailed let:token={tokenData}>
                    <a href="/nft/{nft.mint}?network={isMainnetValue ? 'mainnet' : 'devnet'}"> <!--Keep this as token until nifty asset route is working-->
                        {#if tokenIsLoading}
                            <div class="animate-pulse bg-gray-200 aspect-square rounded"></div>
                        {:else if tokenFailed}
                            <div class="bg-red-100 p-4 rounded aspect-square flex items-center justify-center">
                                <span class="text-red-500">Failed to load NFT data</span>
                            </div>
                        {:else}
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
                        {/if}

</a></div>
                </TokenProvider>
            {/each}
        </div>
    {/if}
</div>
