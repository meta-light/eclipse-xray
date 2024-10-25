<script lang="ts">
    import { formatMoney } from "$lib/utils";
    import { page } from "$app/stores";
    import { trpcWithQuery } from "$lib/trpc/client";
    import { fade } from "svelte/transition";
    const client = trpcWithQuery($page);
    const params = new URLSearchParams(window.location.search);
    const network = params.get("network");
    const isMainnetValue = network !== "devnet";
    const tps = client.tps.createQuery(isMainnetValue);
    const slot = client.currentSlot.createQuery([isMainnetValue]);
    const duneQueryResult = client.duneQuery.createQuery();
    
    const pythPriceQuery = client.pythPrice.createQuery();
    let ethUsdPrice: number | null = null;

    $: if ($pythPriceQuery.data !== undefined) {
        ethUsdPrice = $pythPriceQuery.data;
    }

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
            {#if !$pythPriceQuery.isLoading && ethUsdPrice !== null}
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