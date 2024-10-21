<style>
    .nav::before {content: ""; position: absolute; bottom: 0; left: 0; height: 100%; width: 100vw; transform: translate(-50%, 0);}
    .img {max-height: 55vh;}
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
        decimals: number;
        isNFT: boolean;
        supply: string;
        isToken2022: boolean;
        freezeAuthority?: string;
        mintAuthority?: string;
        metadata?: {
            symbol: string;
            name: string;
            uri: string;
        };
        externalMetadata: {
            image?: string;
            description?: string;
            name?: string;
            symbol?: string;
            attributes?: Array<{ trait_type: string; value: string }>;
            creators?: Array<{ address: string; share: number }>;
            properties?: {
                files?: Array<{ uri: string; type: string }>;
                category?: string;
                [key: string]: any;
            };
            [key: string]: any;
        }
    }

    $: niftyAssetQuery = client.niftyAsset.createQuery([address, isMainnetValue]);
    let asset: NiftyAsset;
    let mediaUrl: string | null = null;
    let mediaType: "image" | "video" | null = null;

    $: if ($niftyAssetQuery.data) {
        asset = $niftyAssetQuery.data as NiftyAsset;
        if (asset.externalMetadata?.image) {
            mediaUrl = asset.externalMetadata.image;
            mediaType = "image";
        } else {
            mediaUrl = null;
            mediaType = null;
        }
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

    onMount(async () => {
        if (asset && asset.owner) {
            try {
                nfts = await fetchAccountData(asset.owner);
            } catch (error) {
                console.error("Error fetching account data:", error);
                fetchError = error instanceof Error ? error.message : String(error);
            }
        }
    });

    function safeStringify(value: any): string {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (typeof value === 'function') return '[Function]';
        if (Array.isArray(value)) {
            return '[' + value.map(safeStringify).join(', ') + ']';
        }
        if (typeof value === 'object') {
            let result = '{';
            for (const key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    if (result.length > 1) result += ', ';
                    result += key + ': ' + safeStringify(value[key]);
                }
            }
            result += '}';
            return result;
        }
        return String(value);
    }


    function hasAttributes(metadata: NiftyAsset['externalMetadata'] | null): metadata is NiftyAsset['externalMetadata'] & { attributes: Array<{ trait_type: string; value: string }> } {
        return metadata !== null && 'attributes' in metadata && Array.isArray(metadata.attributes);
    }

    function hasCreators(metadata: NiftyAsset['externalMetadata'] | null): metadata is NiftyAsset['externalMetadata'] & { creators: Array<{ address: string; share: number }> } {
        return metadata !== null && 'creators' in metadata && Array.isArray(metadata.creators);
    }

    function hasDescription(metadata: NiftyAsset['externalMetadata'] | null): metadata is NiftyAsset['externalMetadata'] & { description: string } {
        return metadata !== null && 'description' in metadata && typeof metadata.description === 'string';
    }
</script>

<div class="content px-3 pb-4">
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
                        {$niftyAssetQuery.data.metadata?.name || $niftyAssetQuery.data.metadata?.name || 'Unnamed Asset'}
                    </h3>
                </div>
                <div>
                    <div class="flex items-center space-x-2 text-black">
                        <!-- {#if mediaUrl}<a href={mediaUrl} target="_blank" class="btn-sm btn border-0 bg-black text-white">View Media</a>{/if} -->
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
                    {:else if mediaType === "image"}
                        <img  class="img m-auto my-3 h-auto w-full rounded-md object-contain" alt="asset media"  src={mediaUrl}  on:error={() => console.error(`Failed to load image: ${mediaUrl}`)}/>
                    {/if}
                </div>
            </div>
        {/if}

        <!-- Details -->
        <div class="mt-3">
            <Collapse sectionTitle="Details" iconId="info" showDetails={true}>
                <div class="grid gap-2">
                    <div class="inline-block rounded-lg card p-0">
                        <h4 class="text-sm font-medium uppercase text-white mb-1">Name</h4>
                        {#if $niftyAssetQuery.data?.metadata?.name}
                            <p class="text-sm text-gray-300 break-words">
                                {$niftyAssetQuery.data.metadata.name}
                            </p>
                        {/if}
                    </div>
                    {#if $niftyAssetQuery.data?.metadata?.symbol && $niftyAssetQuery.data.metadata.symbol.trim().length > 0}
                        <div class="inline-block rounded-lg card p-0">
                            <h4 class="text-sm font-medium uppercase text-white mb-1">Symbol</h4>
                            <p class="text-sm text-gray-300 break-words">
                                {$niftyAssetQuery.data.metadata.symbol}
                            </p>
                        </div>
                    {/if}
                    <div class="card p-0">
                        <header class="flex items-center justify-between gap-6 text-sm font-medium uppercase text-white">
                            <h4>Mint</h4>
                        </header>
                        <p class="text-sm text-gray-300">{$niftyAssetQuery.data.mint}</p>
                    </div>
                </div>
            </Collapse>
        </div>
        {#if $niftyAssetQuery.data.metadata || $niftyAssetQuery.data.externalMetadata}
            <div class="mt-3">
                <Collapse sectionTitle="Metadata" iconId="list">
                    <div class="grid gap-2">
                        {#if $niftyAssetQuery.data?.externalMetadata && hasDescription($niftyAssetQuery.data.externalMetadata) && $niftyAssetQuery.data.externalMetadata.description.length > 0}
                            <div class="inline-block rounded-lg card p-0">
                                <h4 class="text-sm font-medium uppercase text-white mb-1">Description</h4>
                                <p class="text-sm text-gray-300 whitespace-pre-wrap">
                                    {$niftyAssetQuery.data.externalMetadata.description}
                                </p>
                            </div>
                        {/if}
                        {#if $niftyAssetQuery.data?.externalMetadata && hasAttributes($niftyAssetQuery.data.externalMetadata)}
                            <div class="inline-block bg-gray-800 rounded-lg card p-0">
                                <h4 class="text-sm font-medium uppercase text-white mb-1">Attributes</h4>
                                <div class="grid gap-1">
                                    {#each $niftyAssetQuery.data.externalMetadata.attributes as attribute}
                                        <div class="text-sm text-gray-300">
                                            <span class="font-medium break-words">{attribute.trait_type}:</span> 
                                            <span class="break-words">{attribute.value}</span>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                        {#if $niftyAssetQuery.data?.externalMetadata && hasCreators($niftyAssetQuery.data.externalMetadata)}
                            <div class="inline-block rounded-lg card p-0">
                                <h4 class="text-sm font-medium uppercase text-white mb-1">Creators</h4>
                                <div class="grid gap-1">
                                    {#each $niftyAssetQuery.data.externalMetadata.creators as creator}
                                        <div class="text-sm text-gray-300">
                                            <span class="font-medium">Address:</span> 
                                            <span class="break-all">{creator.address}</span>
                                            <br>
                                            <span class="font-medium">Share:</span> {creator.share}%
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                        <div class="card p-0">
                            <header class="flex items-center justify-between gap-6 text-sm font-medium uppercase text-white">
                                <h4>Is Token 2022</h4>
                            </header>
                            <p class="text-sm text-gray-300">{$niftyAssetQuery.data.isToken2022 ? 'Yes' : 'No'}</p>
                        </div>
                        {#each Object.entries($niftyAssetQuery.data.externalMetadata || {}) as [key, value]}
                            {#if !['name', 'symbol', 'description', 'image', 'attributes', 'creators', 'properties'].includes(key)}
                                <div class="inline-block rounded-lg card p-0">
                                    <h4 class="text-sm font-medium uppercase text-white mb-1 break-words">{key}</h4>
                                    <p class="text-sm text-gray-300 whitespace-pre-wrap break-words">
                                        {safeStringify(value)}
                                    </p>
                                </div>
                            {/if}
                        {/each}
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

