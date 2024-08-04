<script lang="ts">
    import { trpcWithQuery } from "$lib/trpc/client";
    import { page } from "$app/stores";
    import { onMount } from 'svelte';
    import TokenProvider from "$lib/components/providers/token-provider.svelte";
    import fallback from "./fallback_image.svg";
    import type { UIAccountToken } from "$lib/types";
    import formatMoney from "$lib/util/format-money";
    import { PriceServiceConnection } from "@pythnetwork/price-service-client";
    import { tweened } from "svelte/motion";

    const account = $page.params.account;
    const client = trpcWithQuery($page);
    const params = new URLSearchParams(window.location.search);
    const network = params.get("network");
    const isMainnetValue = network !== "devnet";

    const toUIAccountToken = (tokenData: any): UIAccountToken => {
        const balance = tokenData.token_info.balance;
        const price = tokenData.token_info.price_info?.price_per_token ?? 0;
        const decimals = tokenData.token_info.decimals;
        return { balance, balanceInUSD: (price * balance) / 10 ** decimals, decimals, fullMetadata: tokenData, id: tokenData.id, price};
    };

    const toUIEthAccountToken = (balance: number, price: number = 0): UIAccountToken => {
        return { balance, balanceInUSD: price * balance, decimals: 18, fullMetadata: null, id: 'ETH', price };
    };

    const isEth = (t: UIAccountToken): boolean => t.id === 'ETH';

    const getTokensRequest = client.searchAssets.createQuery({account, isMainnet: isMainnetValue, nativeBalance: true, tokenType: "fungible",});

    $: getTokensRequestItems = ($getTokensRequest?.data?.tokens ?? []) as [];
    $: lamports = $getTokensRequest?.data?.nativeBalance ?? 0;
    $: ethToken = toUIEthAccountToken($balance, ethUsdPrice ?? 0);
    $: partialTokens = getTokensRequestItems.map(toUIAccountToken);
    $: tokens = [ethToken, ...partialTokens.filter(t => !isEth(t))].sort((a, b) => b.balanceInUSD - a.balanceInUSD);

    const accountInfo = client.accountInfo.createQuery([account, isMainnetValue ? "mainnet" : "devnet"]);
    const balance = tweened(0, {duration: 1000});
    let ethUsdPrice: number | null = null;
    $: if ($accountInfo?.data?.balance) {balance.set($accountInfo.data.balance);}

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

    $: worth = $balance * (ethUsdPrice ?? 0);
</script>

<div>
    {#if $getTokensRequest}
        {#each tokens as token}
            <a class="mb-4 grid grid-cols-12 items-center gap-3 rounded-lg border px-3 py-2 hover:border-primary" href="/token/{token.id}">
                <div class="col-span-2 p-1 md:col-span-1">
                    <div style="background-image: url({isEth(token) ? '/media/tokens/ethereum.svg' : token.fullMetadata?.image ?? fallback})" class="aspect-square w-full rounded-lg bg-cover bg-no-repeat border"/>
                </div>
                <div class="col-span-10 flex items-center justify-between text-right md:col-span-11">
                    <div>
                        <h4 class="font-semibold md:text-sm">
                            {isEth(token) ? 'ETH' : (token.fullMetadata?.name || "Unrecognised Token")}
                        </h4>
                    </div>
                    <div>
                        <h4 class="font-semibold md:text-sm">
                            {isEth(token) 
                                ? token.balance.toFixed(6) 
                                : (token.balance / 10 ** token.decimals).toLocaleString()}
                        </h4>
                        <h4 class="text-xs opacity-50">
                            {#if token.price}
                                {formatMoney(token.balanceInUSD)}
                            {/if}
                        </h4>
                    </div>
                </div>
            </a>
        {/each}
    {:else}
        {#each Array(3) as _}
            <div
                class="mb-3 grid animate-pulse grid-cols-12 items-center gap-3 rounded-lg"
            >
                <div class="col-span-2 p-1 md:col-span-1">
                    <div class="aspect-square w-full rounded-full bg-secondary"/>
                </div>
                <div class="col-span-10 flex items-center justify-between md:col-span-11">
                    <div>
                        <div class="mb-2 h-3 w-32 animate-pulse rounded-full bg-secondary"/>
                        <div class="h-2 w-20 animate-pulse rounded-full bg-secondary" />
                    </div>
                    <div class="h-2 w-5 animate-pulse rounded-full bg-secondary"/>
                </div>
            </div>
        {/each}
    {/if}
</div>