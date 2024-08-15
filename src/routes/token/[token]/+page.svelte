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
                <p>Address: {$tokenQuery.data.address}</p>
                <p>Decimals: {$tokenQuery.data.decimals}</p>
                <p>Supply: {$tokenQuery.data.supply}</p>
                <p>Token Type: {$tokenQuery.data.isToken2022 ? 'Token-2022' : 'Regular Token'}</p>
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