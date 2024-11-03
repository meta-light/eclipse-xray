<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { getRPCUrl } from "$lib/utils";
    import { Connection, PublicKey } from "@solana/web3.js";
    import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, AccountLayout } from "@solana/spl-token";
    import TokenProvider from "$lib/components/providers/token-provider.svelte";
    import { trpcWithQuery } from '$lib/trpc/client';
    import { tokenConfig, ETH  } from '$lib/config';
    const account = $page.params.account;
    let tokens: any[] = [];
    let nativeBalance: number | null = null;
    let fetchError: string | null = null;
    let isLoading = true;
    const isMainnetValue = $page.url.searchParams.get("network") !== "devnet";
    const client = trpcWithQuery($page);
    const pythPricesQuery = client.pythPrices.createQuery();
    let prices: Record<string, number | null> = {};
    $: if ($pythPricesQuery.data !== undefined) {prices = $pythPricesQuery.data;}
    let isMetadataLoading = false;
    let loadingTokens = new Set<string>();

    async function fetchAccountData() {
        isLoading = true;
        loadingTokens.clear();
        isMetadataLoading = false;
        try {
            const rpcUrl = getRPCUrl(isMainnetValue ? "mainnet" : "devnet");
            const connection = new Connection(rpcUrl, "confirmed");
            const pubkey = new PublicKey(account);
            const [balance, splTokenAccounts, token2022Accounts] = await Promise.all([
                connection.getBalance(pubkey),
                connection.getTokenAccountsByOwner(pubkey, { programId: TOKEN_PROGRAM_ID }),
                connection.getTokenAccountsByOwner(pubkey, { programId: TOKEN_2022_PROGRAM_ID }),
            ]);
            nativeBalance = balance / 1e9;
            const allTokenAccounts = [...splTokenAccounts.value, ...token2022Accounts.value];
            tokens = await Promise.all(allTokenAccounts.map(async (ta) => {
                const data = new Uint8Array(ta.account.data);
                const accountInfo = AccountLayout.decode(data);
                const mintPubkey = new PublicKey(accountInfo.mint);                
                return {mint: mintPubkey.toString(), tokenAccount: ta.pubkey.toString(), balance: Number(accountInfo.amount), isToken2022: ta.account.owner.equals(TOKEN_2022_PROGRAM_ID)};
            }));
            tokens = tokens.filter(token => token.mint !== ETH);
            tokens.unshift({mint: ETH, tokenAccount: account, balance: nativeBalance * 1e9, isToken2022: false});
        } 
        catch (error) {console.error("Error fetching account data:", error); fetchError = error instanceof Error ? error.message : String(error);} 
        finally {isLoading = false;}
    }

    onMount(fetchAccountData);

    function formatBalance(balance: number, decimals: number): string {
        const formattedBalance = balance / Math.pow(10, decimals);
        if (Number.isInteger(formattedBalance)) {return formattedBalance.toLocaleString('en-US', { maximumFractionDigits: 0 });} 
        else {return formattedBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: decimals });}
    }

    function getTokenPrice(metadata: any): number | null {
        if (!metadata?.name) {return null;}
        if (metadata.mint === ETH) {return prices['ETH'];}
        const tokenConfigEntry = Object.values(tokenConfig).find(config => config.symbol === metadata.symbol || config.aliases?.includes(metadata.name) || config.mint === metadata.mint);
        if (!tokenConfigEntry) {return null;}
        return prices[tokenConfigEntry.symbol];
    }

    function formatUSD(amount: number): string {return new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(amount);}

    function handleMetadataLoading(event: CustomEvent, tokenMint: string) {
        if (event.detail) {loadingTokens.add(tokenMint);} 
        else {loadingTokens.delete(tokenMint);}
        loadingTokens = loadingTokens;
        isMetadataLoading = loadingTokens.size > 0;
    }
</script>

<div class="container mx-auto px-4">
    <h2 class="text-2xl font-bold mb-4">Account Tokens</h2>
    {#if isLoading || isMetadataLoading}
        <div class="flex justify-center items-center p-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
    {:else if fetchError}
        <p class="text-red-500">Error loading tokens: {fetchError}</p>
    {:else if tokens.length === 0}
        <p>No tokens found for this account.</p>
    {:else}
        <div class="space-y-4">
            {#each tokens as token (token.mint)}
                <TokenProvider address={token.mint} on:metadataLoading={(e) => handleMetadataLoading(e, token.mint)}>
                    <div slot="default" let:metadata let:isNFT let:token={tokenData}>
                        {#if !isNFT}
                            <a href="/token/{token.mint}?network={isMainnetValue ? 'mainnet' : 'devnet'}">
                                <div class="bg-white shadow rounded-lg p-4 flex items-center justify-between">
                                    <div class="flex items-center space-x-4">
                                        {#if isMetadataLoading}
                                            <div class="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                                            <div>
                                                <div class="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                                                <div class="h-3 w-32 bg-gray-100 rounded animate-pulse"></div>
                                            </div>
                                        {:else}
                                            {#if metadata?.image}
                                                <img src={metadata.image} alt={metadata.name} class="w-10 h-10 rounded-full">
                                            {:else}
                                                <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <span class="text-gray-500 text-xs">{(metadata?.name || "??").substring(0, 2).toUpperCase()}</span>
                                                </div>
                                            {/if}
                                            <div>
                                                <h3 class="font-semibold">{metadata?.name || "Unknown Token"}</h3>
                                                <p class="text-sm text-gray-500">{token.mint}</p>
                                            </div>
                                        {/if}
                                    </div>
                                    <div class="text-right">
                                        <p class="font-bold">{formatBalance(token.balance, tokenData?.decimals || 9)}</p>
                                        {#if getTokenPrice(metadata)}
                                            <p class="text-sm text-gray-600">{formatUSD((getTokenPrice(metadata) || 0) * (token.balance / Math.pow(10, tokenData?.decimals || 9)))}</p>
                                        {/if}
                                        {#if token.mint === ETH}
                                            <span class="text-xs text-purple-500">Native ETH</span>
                                        {:else if token.isToken2022}
                                            <span class="text-xs text-blue-500">Token-2022</span>
                                        {:else}
                                            <span class="text-xs text-green-500">SPL Token</span>
                                        {/if}
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