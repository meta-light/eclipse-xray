<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from 'svelte';
    import { getRPCUrl } from "$lib/util/get-rpc-url";
    import { PriceServiceConnection } from "@pythnetwork/price-service-client";
    import { tweened } from "svelte/motion";
    import formatMoney from "$lib/util/format-money";
    import fallback from "./fallback_image.svg";

    const { account } = $page.params;
    const params = new URLSearchParams(window.location.search);
    const network = params.get("network");
    const isMainnetValue = network !== "devnet";

    let tokens: any[] = [];
    let nativeBalance = 0;
    let fetchError: string | null = null;
    let ethUsdPrice: number | null = null;
    const balance = tweened(0, {duration: 1000});

    async function fetchAccountData() {
        const rpcUrl = getRPCUrl(isMainnetValue ? "mainnet" : "devnet");
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getProgramAccounts',
                params: [
                    account,
                    {
                        encoding: "jsonParsed",
                        filters: [
                            {
                                dataSize: 165
                            }
                        ]
                    }
                ]
            })
        });
        if (!response.ok) {throw new Error(`HTTP error! status: ${response.status}`);}
        const result = await response.json();
        console.log("Account data fetched:", result);
        return result.result || [];
    }

    async function fetchNativeBalance() {
        const rpcUrl = getRPCUrl(isMainnetValue ? "mainnet" : "devnet");
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getBalance',
                params: [account]
            })
        });
        if (!response.ok) {throw new Error(`HTTP error! status: ${response.status}`);}
        const result = await response.json();
        return result.result.value / 1e9;
    }

    onMount(async () => {
        try {
            const accountData = await fetchAccountData();
            nativeBalance = await fetchNativeBalance();
            balance.set(nativeBalance);

            tokens = accountData
                .map((item: any) => {
                    const parsedData = item.account.data.parsed.info;
                    return {
                        mint: parsedData.mint,
                        tokenAccount: item.pubkey,
                        balance: parsedData.tokenAmount.uiAmount,
                        decimals: parsedData.tokenAmount.decimals,
                        isNFT: parsedData.tokenAmount.decimals === 0 && parsedData.tokenAmount.uiAmount === 1
                    };
                })
                .filter((token: { isNFT: boolean }) => !token.isNFT);
            tokens.unshift({
                mint: 'ETH',
                tokenAccount: account,
                balance: nativeBalance,
                decimals: 9,
                isNFT: false
            });
            const connection = new PriceServiceConnection("https://hermes.pyth.network");
            const priceIds = ["0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"];
            const [ethUsdFeed] = (await connection.getLatestPriceFeeds(priceIds)) ?? [];
            const price = ethUsdFeed?.getPriceUnchecked();
            ethUsdPrice = price && typeof price.price === 'string' && typeof price.expo === 'number' ? parseFloat(price.price) * Math.pow(10, price.expo) : null;
        } catch (error) {
            console.error("Error fetching account data:", error);
            fetchError = error instanceof Error ? error.message : String(error);
        }
    });
</script>

<div>
    {#if fetchError}
        <p class="text-red-500">Error loading tokens: {fetchError}</p>
    {:else if tokens.length === 0}
        <p>Loading tokens...</p>
    {:else}
        {#each tokens as token}
            {#if token.mint === 'ETH'}
                <div class="mb-4 grid grid-cols-12 items-center gap-3 rounded-lg border px-3 py-2">
                    <div class="col-span-2 p-1 md:col-span-1">
                        <div class="aspect-square w-full rounded-lg bg-cover bg-no-repeat border flex items-center justify-center" 
                             style="background-image: url('/media/tokens/ethereum.svg'); 
                                    background-color: 'transparent';">
                        </div>
                    </div>
                    <div class="col-span-10 flex items-center justify-between text-right md:col-span-11">
                        <div>
                            <h4 class="font-semibold md:text-sm">
                                ETH
                            </h4>
                        </div>
                        <div>
                            <h4 class="font-semibold md:text-sm">
                                {token.balance.toLocaleString(undefined, {maximumFractionDigits: 9})}
                            </h4>
                            <h4 class="text-xs opacity-50">
                                {#if ethUsdPrice}
                                    {formatMoney(token.balance * ethUsdPrice)}
                                {/if}
                            </h4>
                        </div>
                    </div>
                </div>
            {:else}
                <a href="/token/{token.mint}?network={isMainnetValue ? 'mainnet' : 'devnet'}" class="block">
                    <div class="mb-4 grid grid-cols-12 items-center gap-3 rounded-lg border px-3 py-2 hover:border-primary">
                        <div class="col-span-2 p-1 md:col-span-1">
                            <div class="aspect-square w-full rounded-lg bg-cover bg-no-repeat border flex items-center justify-center" 
                                 style="background-image: url({fallback}); 
                                        background-color: '#f0f0f0';">
                                <span class="text-2xl font-bold text-gray-400">?</span>
                            </div>
                        </div>
                        <div class="col-span-10 flex items-center justify-between text-right md:col-span-11">
                            <div>
                                <h4 class="font-semibold md:text-sm">
                                    {token.mint.slice(0, 4) + '...' + token.mint.slice(-4)}
                                </h4>
                            </div>
                            <div>
                                <h4 class="font-semibold md:text-sm">
                                    {token.balance.toLocaleString(undefined, {maximumFractionDigits: 9})}
                                </h4>
                                <h4 class="text-xs opacity-50">
                                    {#if ethUsdPrice}
                                        {formatMoney(token.balance * ethUsdPrice)}
                                    {/if}
                                </h4>
                            </div>
                        </div>
                    </div>
                </a>
            {/if}
        {/each}
    {/if}
</div>