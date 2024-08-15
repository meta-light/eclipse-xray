<style>
    .nav::before {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        height: 100%;
        width: 100vw;
        transform: translate(-50%, 0);
    }

    .img {
        max-height: 55vh;
    }
</style>

<script lang="ts">
    import { page } from "$app/stores";
    import { trpcWithQuery } from "$lib/trpc/client";
    import Collapse from "$lib/components/collapse.svelte";
    import CopyButton from "$lib/components/copy-button.svelte";
    import JSON from "$lib/components/json.svelte";
    import PageLoader from "./_loader.svelte";
    import { onMount } from 'svelte';
    import { getRPCUrl } from "$lib/util/get-rpc-url";
    const address = $page.params.asset;
    const params = new URLSearchParams(window.location.search);
    const network = params.get("network");
    const isMainnetValue = network !== "devnet";
    const client = trpcWithQuery($page);
    interface NiftyAsset {
        mint: string;
        address: string;
        owner?: string;
        amount?: string;
        supply?: string;
        decimals: number;
        metadata?: {
            name?: string;
            symbol?: string;
            uri?: string;
        };
    }
    $: niftyAssetQuery = client.niftyAsset.createQuery([address, isMainnetValue]);
    let asset: NiftyAsset;
    let mediaUrl: string | null = null;
    let mediaType: "image" | "video" | null = null;
    $: if ($niftyAssetQuery.data) {
        asset = $niftyAssetQuery.data;
        if (asset.metadata && asset.metadata.uri) {mediaUrl = asset.metadata.uri; mediaType = "image";}
    }
    let nfts: any[] = [];
    let fetchError: string | null = null;
    interface Token { isNFT: boolean; mint: string; tokenAccount: string; amount: number; decimals: number; }
    async function fetchAccountData(account: string) {
        const rpcUrl = getRPCUrl(isMainnetValue ? "mainnet" : "devnet");
        try {
            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: globalThis.JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getProgramAccounts',
                    params: [
                        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        {
                            encoding: "jsonParsed",
                            filters: [
                                {dataSize: 165},
                                {memcmp: {offset: 32, bytes: account}}
                            ]
                        }
                    ]
                })
            });

            if (!response.ok) {throw new Error(`HTTP error! status: ${response.status}`);}
            const result = await response.json();
            console.log("Account data fetched:", result);
            if (result.error) {throw new Error(result.error.message);}
            if (!result.result) {throw new Error("No account data found");}
            const nfts = result.result.map((item: any) => {
                const parsedData = item.account.data.parsed.info;
                return {
                    mint: parsedData.mint,
                    tokenAccount: item.pubkey,
                    amount: parsedData.tokenAmount.uiAmount,
                    decimals: parsedData.tokenAmount.decimals,
                    isNFT: parsedData.tokenAmount.decimals === 0 && parsedData.tokenAmount.uiAmount === 1
                };
            }).filter((token: any) => token.isNFT);
            return nfts;
        } catch (error) {
            console.error("Error fetching account data:", error);
            throw error;
        }
    }
    onMount(async () => {if (asset && asset.owner) {try {nfts = await fetchAccountData(asset.owner);} catch (error) {console.error("Error fetching account data:", error); fetchError = error instanceof Error ? error.message : String(error);}}});
</script>

<div class="content px-3">
    {#if $niftyAssetQuery.isLoading}
        <PageLoader />
    {:else if $niftyAssetQuery.error}
        <div class="error-container p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <h2 class="text-lg font-semibold mb-2">Error loading nifty asset data</h2>
            <p>{$niftyAssetQuery.error.message}</p>
            {#if $niftyAssetQuery.error.data?.code === 'BAD_REQUEST'}
                <p class="mt-2 text-sm">Please check that the asset address is correct and try again.</p>
            {:else if $niftyAssetQuery.error.data?.code === 'NOT_FOUND'}
                <p class="mt-2 text-sm">The nifty asset could not be found. It might not exist or there might be an issue with the network.</p>
            {:else}
                <p class="mt-2 text-sm">An unexpected error occurred. Please try again later or contact support if the problem persists.</p>
            {/if}
        </div>
    {:else if $niftyAssetQuery.data}
        <div class="nav content sticky z-30 px-3 py-2 text-white">
            <div class="relative flex flex-wrap items-center justify-between bg-gray-200 py-2 px-2 rounded-lg">
                <div>
                    <h3 class="m-0 text-l font-bold md:text-l text-black">
                        {$niftyAssetQuery.data.metadata?.name || 'Unnamed Asset'}
                    </h3>
                </div>
                <div>
                    <div class="flex items-center space-x-2 text-black">
                        {#if mediaUrl}<a href={mediaUrl} target="_blank" class="btn-sm btn border-0 bg-black text-white">View Media</a>{/if}
                        <CopyButton text={$page.params.asset} />
                        <CopyButton text={$page.url.href} icon="link" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Display media if available -->
        {#if mediaUrl}
            <div class="content px-3">
                <div class="flex flex-col items-center justify-center">
                    {#if mediaType === "video"}
                        <video class="m-auto my-3 h-auto w-full rounded-md object-contain" controls autoplay loop muted src={mediaUrl} />
                    {:else}
                        <img class="img m-auto my-3 h-auto w-full rounded-md object-contain" alt="asset media" src={mediaUrl} />
                    {/if}
                </div>
            </div>
        {/if}

        <!-- Details -->
        <div class="mt-3">
            <Collapse sectionTitle="Details" iconId="info" showDetails={true}>
                <div class="grid gap-2">
                    <div class="card p-0">
                        <header class="flex items-center justify-between gap-6 text-sm font-medium uppercase text-white">
                            <h4>Mint</h4>
                        </header>
                        <p class="text-sm text-gray-300">{$niftyAssetQuery.data.mint}</p>
                    </div>
                    {#if $niftyAssetQuery.data.owner}
                        <div class="card p-0">
                            <header class="flex items-center justify-between gap-6 text-sm font-medium uppercase text-white">
                                <h4>Owner</h4>
                            </header>
                            <p class="text-sm text-gray-300">{$niftyAssetQuery.data.owner}</p>
                        </div>
                    {/if}
                    <div class="card p-0">
                        <header class="flex items-center justify-between gap-6 text-sm font-medium uppercase text-white">
                            <h4>Supply</h4>
                        </header>
                        <p class="text-sm text-gray-300">{$niftyAssetQuery.data.supply || $niftyAssetQuery.data.amount || 'N/A'}</p>
                    </div>
                    <div class="card p-0">
                        <header class="flex items-center justify-between gap-6 text-sm font-medium uppercase text-white">
                            <h4>Decimals</h4>
                        </header>
                        <p class="text-sm text-gray-300">{$niftyAssetQuery.data.decimals}</p>
                    </div>
                </div>
            </Collapse>
        </div>
        {#if $niftyAssetQuery.data.metadata}
            <div class="mt-3">
                <Collapse sectionTitle="Metadata" iconId="list">
                    <div class="grid gap-2">
                        <div class="card p-0">
                            <header class="flex items-center justify-between gap-6 text-sm font-medium uppercase text-gray-500">
                                <h4>Name</h4>
                            </header>
                            <p class="text-sm">{$niftyAssetQuery.data.metadata.name}</p>
                        </div>
                        <div class="card p-0">
                            <header class="flex items-center justify-between gap-6 text-sm font-medium uppercase text-gray-500">
                                <h4>Symbol</h4>
                            </header>
                            <p class="text-sm">{$niftyAssetQuery.data.metadata.symbol}</p>
                        </div>
                        <div class="card p-0">
                            <header class="flex items-center justify-between gap-6 text-sm font-medium uppercase text-gray-500">
                                <h4>URI</h4>
                            </header>
                            <p class="text-sm">{$niftyAssetQuery.data.metadata.uri}</p>
                        </div>
                    </div>
                </Collapse>
            </div>
        {/if}
        <div class="mt-3">
            <Collapse sectionTitle="JSON Data" iconId="json" showDetails={false}>
                <JSON data={$niftyAssetQuery.data} label="niftyAsset" />
            </Collapse>
        </div>
        {#if nfts.length > 0}
            <div class="mt-3">
                <Collapse sectionTitle="NFTs owned by this wallet" iconId="image" showDetails={true}>
                    <div class="grid gap-2">
                        {#each nfts as nft}
                            <a class="card p-0" href="/nifty-asset/{nft.mint}?network={isMainnetValue ? 'mainnet' : 'devnet'}">
                                <header class="flex items-center justify-between gap-6 text-sm font-medium uppercase text-gray-500">
                                    <h4>{nft.mint}</h4>
                                </header>
                                <p class="text-sm">{nft.tokenAccount}</p>
                            </a>
                        {/each}
                    </div>
                </Collapse>
            </div>
        {/if}
    {:else}
        <p>No asset data available</p>
    {/if}
</div>