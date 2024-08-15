<script lang="ts">
    import formatMoney from "$lib/util/format-money";
    import { page } from "$app/stores";
    import { trpcWithQuery } from "$lib/trpc/client";
    import { fade } from "svelte/transition";
    import { PriceServiceConnection } from "@pythnetwork/price-service-client";
    import { onMount } from "svelte";
    const client = trpcWithQuery($page);
    const params = new URLSearchParams(window.location.search);
    const network = params.get("network");
    const isMainnetValue = network !== "devnet";
    const tps = client.tps.createQuery(isMainnetValue);
    const slot = client.currentSlot.createQuery([isMainnetValue]);
    let ethUsdPrice: number | null = null;
    const duneQueryResult = client.duneQuery.createQuery();
    onMount(async () => {
        const connection = new PriceServiceConnection("https://hermes.pyth.network");
        const priceIds = ["0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"];
        try {
            const [ethUsdFeed] = (await connection.getLatestPriceFeeds(priceIds)) ?? [];
            const price = ethUsdFeed?.getPriceUnchecked();
            ethUsdPrice = price && typeof price.price === 'string' && typeof price.expo === 'number' ? parseFloat(price.price) * Math.pow(10, price.expo) : null;
        } catch (error) {
            console.error("Error fetching ETH/USD price:", error);
        }
    });

    // Add a function to format large numbers
    function formatLargeNumber(num: number): string {
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return num.toString();
    }
</script>

<div class="flex h-10 w-full items-center justify-center text-xs px-2">
    <div class="flex items-center space-x-4 mr-4">
        <div>
            {#if !$tps.isLoading}
                <div in:fade={{duration: 500}}>
                    <span class="font-bold">TPS:</span>
                    <span class="opacity-50">{$tps?.data?.toFixed(0)}</span>
                </div>
            {:else}
                <div class="pulse h-2 w-12 rounded-lg bg-secondary" />
            {/if}
        </div>
        <div>
            {#if ethUsdPrice !== null}
                <div in:fade={{duration: 500}}>
                    <span class="font-bold">ETH:</span>
                    <span class="opacity-50">{formatMoney(ethUsdPrice)}</span>
                </div>
            {:else}
                <div class="pulse h-2 w-16 rounded-lg bg-secondary" />
            {/if}
        </div>
        <div>
            {#if !$slot.isLoading}
                <div in:fade={{duration: 500}}>
                    <span class="font-bold">Slot:</span>
                    <a data-sveltekit-reload href="/block/{$slot?.data}?network={isMainnetValue ? 'mainnet' : 'devnet'}" class="opacity-50 hover:opacity-100 hover:link-success">{$slot?.data?.toLocaleString()}</a>
                </div>
            {:else}
                <div class="pulse h-2 w-20 rounded-lg bg-secondary" />
            {/if}
        </div>
    </div>
    <div class="flex items-center space-x-4">
        {#if !$duneQueryResult.isLoading}
            <div in:fade={{duration: 500}}>
                <span class="font-bold">Bridged:</span>
                <span class="opacity-50">{formatLargeNumber($duneQueryResult.data.total_deposits)} ETH</span>
            </div>
            <div in:fade={{duration: 500}}>
                <span class="font-bold">Txs:</span>
                <span class="opacity-50">{formatLargeNumber($duneQueryResult.data.transaction_count)}</span>
            </div>
            <div in:fade={{duration: 500}}>
                <span class="font-bold">Users:</span>
                <span class="opacity-50">{formatLargeNumber($duneQueryResult.data.users)}</span>
            </div>
        {:else}
            <div class="pulse h-2 w-64 rounded-lg bg-secondary" />
        {/if}
    </div>
</div>