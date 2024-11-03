<style>
    .nav {position: relative; background-color: white;}
    .nav::before {
        content: "";
        position: absolute;
        top: 0;
        left: 50%;
        height: 100%;
        width: 100vw;
        transform: translateX(-50%);
        background-color: white;
        z-index: -1;
    }
</style>

<script lang="ts">
    import { page } from "$app/stores";
    import { trpcWithQuery } from "$lib/trpc/client";
    import Collapse from "$lib/components/collapse.svelte";
    import JSON from "$lib/components/json.svelte";
    import type { ExternalMetadata } from "$lib/types";
    import Transactions from "$lib/components/transactions.svelte";
    import PageLoader from "./_loader.svelte";
    import CopyButton from "$lib/components/copy-button.svelte";
    const address = $page.params.token;
    const params = new URLSearchParams(window.location.search);
    const network = params.get("network");
    const isMainnetValue = network !== "devnet";
    const client = trpcWithQuery($page);
    $: tokenQuery = client.token.createQuery([address, isMainnetValue]);
    $: if ($tokenQuery.error) {console.error("Token query error:", $tokenQuery.error);}
    $: externalMetadata = $tokenQuery.data?.externalMetadata as ExternalMetadata | undefined;
</script>

<div class="content px-3 mb-4">
    {#if $tokenQuery.isLoading}
        <PageLoader />
    {:else if $tokenQuery.error}
        <div class="error-container p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <h2 class="text-lg font-semibold mb-2">Error loading token data</h2>
            <p>{$tokenQuery.error.message}</p>
            <p class="mt-2 text-sm">Please check the token address and try again. If the problem persists, the token might not exist or there might be an issue with the network.</p>
        </div>
    {:else if $tokenQuery.data}
        <div class="nav content sticky z-30 px-3 py-2 text-white">
            <div class="relative flex flex-wrap items-center justify-between bg-gray-200 py-2 px-2 rounded-lg">
                <div>
                    <h3 class="m-0 text-l font-bold md:text-l text-black">
                        {$tokenQuery.data.address}
                    </h3>
                </div>
                <div>
                    <div class="flex items-center space-x-2 text-black">
                        <CopyButton text={address} />
                        <CopyButton text={$page.url.href} icon="link" />
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-6">
            <Collapse sectionTitle="Token Information" iconId="info" showDetails={true}>
                <div class="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                    {#if externalMetadata?.image || $tokenQuery.data.metadata?.image}
                        <img 
                            src={externalMetadata?.image || $tokenQuery.data.metadata?.image} 
                            alt={$tokenQuery.data.metadata?.name || "Token"} 
                            class="w-24 h-24 object-contain rounded-full bg-gray-100" 
                        />
                    {/if}
                    <div>
                        <p class="font-bold text-lg">{$tokenQuery.data.metadata?.name || "Unknown Token"}</p>
                        {#if externalMetadata?.description}
                            <p class="text-gray-600 mt-2">{externalMetadata.description}</p>
                        {/if}
                    </div>
                </div>
                <div class="mt-4 grid grid-cols-[auto,1fr] gap-x-4 gap-y-2">
                    <span class="font-semibold">Symbol:</span>
                    <span>{$tokenQuery.data.metadata?.symbol}</span>
                    
                    <span class="font-semibold">Address:</span>
                    <span class="break-all">{$tokenQuery.data.address}</span>
                    
                    <span class="font-semibold">Decimals:</span>
                    <span>{$tokenQuery.data.decimals}</span>
                    
                    <span class="font-semibold">Supply:</span>
                    <span class="break-all">{$tokenQuery.data.supply}</span>
                    
                    <span class="font-semibold">Token Type:</span>
                    <span>{$tokenQuery.data.isToken2022 ? 'Token-2022' : 'SPL Token'}</span>
                </div>
            </Collapse>
        </div>
        <div class="mb-6 mt-6">
            <Collapse sectionTitle="JSON Metadata" iconId="json" showDetails={false}>
                <JSON data={$tokenQuery.data} label="token" />
            </Collapse>
        </div>
        <div class="mt-3 pl-2 md:pl-0">
            <Transactions account={address} />
        </div>
    {:else}
        <p>No token data found. Please check the token address and network.</p>
    {/if}
</div>
