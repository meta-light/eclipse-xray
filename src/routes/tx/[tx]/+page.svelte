<script lang="ts">
    // @ts-nocheck
    import type { ProtonTransaction } from "$lib/xray";

    import { onMount } from "svelte";

    import { page } from "$app/stores";

    import { fly } from "svelte/transition";

    import { Circle } from "svelte-loading-spinners";

    import { trpcWithQuery } from "$lib/trpc/client";

    import Account from "$lib/components/account-data.svelte";
    import CopyButton from "$lib/components/copy-button.svelte";
    import IconCard from "$lib/components/icon-card.svelte";
    import Icon from "$lib/components/icon.svelte";
    import JSON from "$lib/components/json.svelte";
    import LogMessages from "$lib/components/log-messages.svelte";
    import Transaction from "$lib/components/transaction.svelte";
    import Collapse from "$lib/components/collapse.svelte";
    import Network from "$lib/components/network.svelte";

    function getNetworkString(isMainnet: boolean): string {
        return isMainnet ? 'mainnet' : 'devnet';
    }

    function safeStringify(obj: any): string {
        try {
            return JSON.stringify(obj, null, 2);
        } catch (error) {
            return `Error stringifying object: ${error.message}`;
        }
    }

    let animate = false;
    let isLoading = true;
    let isMounted = false;
    let updatedMetadata;

    const signature = $page.params.tx;

    const client = trpcWithQuery($page);
    const params = new URLSearchParams(window.location.search);
    const network = params.get("network");
    const isMainnetValue = network !== "devnet";
    let transaction: ProtonTransaction | null = null;
    let error: any = null;

    $: rawTransactionQuery = client.rawTransaction.createQuery({
        transaction: signature || "",
        network: getNetworkString(isMainnetValue)
    }, {
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    $: {
        if ($rawTransactionQuery.data) {
            transaction = $rawTransactionQuery.data;
            isLoading = false;
            error = null;
            console.log("Transaction data:", transaction);
        } else if ($rawTransactionQuery.error) {
            error = "Error fetching transaction";
            isLoading = false;
            console.error("Error:", $rawTransactionQuery.error);
        }
    }

    $: transactionData = transaction ? {
        blockTime: transaction.blockTime,
        slot: transaction.slot,
        version: transaction.version,
        meta: transaction.meta,
        transaction: transaction.transaction
    } : null;

    onMount(() => {
        animate = true;
        isMounted = true;
        if ($rawTransactionQuery.refetch) {
            $rawTransactionQuery.refetch();
        }
    });
</script>

{#if isLoading}
    <div
        class="flex content-center justify-center pt-4"
        aria-label="Loading spinner"
    >
        <Circle
            size="50"
            color="#FFFFFF"
            unit="px"
            duration="1s"
        />
    </div>
{:else if error}
    <h2 class="mb-6 mt-20 text-center text-lg opacity-90">
        Transaction not found. Try selecting another network.
    </h2>
    <Network />
{:else if transaction}
    <div class="content mb-4 mt-4 flex justify-between px-3">
        <h1 class="text-xl font-bold">Transaction</h1>
        <div class="flex" on:click|preventDefault on:keydown|preventDefault>
            <CopyButton success="" text={$page.params.search} />
            <CopyButton icon="link" success="" text={$page.url.href} />
        </div>
    </div>
    {#if animate}
        <div in:fly={{ delay: 500, duration: 1000, opacity: 0, y: 50 }} class="content pl-2 md:pl-0 mb-2">
            <div class="px-3">
                <Transaction {transaction} />
            </div>

            {#if transaction.accounts}
                <div class="mb-3 px-3">
                    <Collapse 
                        sectionTitle="Account Changes" 
                        sectionAditionalInfo="Changes to account data"
                        showDetails={false} 
                        iconId="account"
                    >
                        {#each transaction.accounts as account}
                            <Account data={account} />
                        {/each}
                    </Collapse>
                </div>
            {/if}

            <div class="mb-3 px-3">
                <div class="mt-3 grid grid-cols-12 items-center gap-3 rounded-lg border p-1 py-3">
                    {#if transaction.meta?.err}
                        <div class="col-span-2 p-1 md:col-span-1">
                            <div class="center ml-1 h-10 w-10 rounded-full bg-error">
                                <Icon id="close" fill="black" size="sm" />
                            </div>
                        </div>
                        <div class="col-span-10 flex items-center justify-between md:col-span-11">
                            <div>
                                <h4 class="text-lg font-semibold md:text-sm">Status</h4>
                                <h3 class="mr-2 text-xs opacity-50">This transaction has failed.</h3>
                            </div>
                            <div class="badge badge-error mr-1">Error</div>
                        </div>
                    {:else}
                        <div class="col-span-2 p-1 md:col-span-1">
                            <div class="center ml-1 h-10 w-10 rounded-full bg-success">
                                <Icon id="check" fill="black" size="sm" />
                            </div>
                        </div>
                        <div class="col-span-10 flex items-center justify-between md:col-span-11">
                            <div>
                                <h4 class="text-lg font-semibold md:text-sm">Status</h4>
                                <h3 class="mr-2 text-xs opacity-50">This transaction has successfully processed.</h3>
                            </div>
                            <div class="badge badge-success mr-1">Success</div>
                        </div>
                    {/if}
                </div>
            </div>

            <div class="mb-3 px-3">
                <div class="mt-3 grid grid-cols-12 items-center gap-3 rounded-lg border p-1 py-3">
                    <div class="col-span-2 p-1 md:col-span-1">
                        <div class="center ml-1 h-10 w-10 rounded-full bg-gray-200">
                            <Icon id="network" size="sm" fill="black"/>
                        </div>
                    </div>
                    <div class="col-span-10 flex items-center justify-between pr-1 md:col-span-11">
                        <div>
                            <h4 class="text-lg font-semibold md:text-sm">Network</h4>
                            <h3 class="mr-2 text-xs opacity-50">Current network for this transaction.</h3>
                        </div>
                        <p class="text-xs md:text-sm">{isMainnetValue ? 'Mainnet' : 'Devnet'}</p>
                    </div>
                </div>
            </div>

            <div class="mb-3 px-3">
                <div class="mt-3 grid grid-cols-12 items-center gap-3 rounded-lg border p-1 py-3">
                    <div class="col-span-2 p-1 md:col-span-1">
                        <div class="center ml-1 h-10 w-10 rounded-full bg-gray-200">
                            <Icon id="box" size="sm" />
                        </div>
                    </div>
                    <div class="col-span-10 flex items-center justify-between pr-1 md:col-span-11">
                        <div>
                            <h4 class="text-lg font-semibold md:text-sm">Slot</h4>
                            <h3 class="mr-2 text-xs opacity-50">The slot this transaction happened on.</h3>
                        </div>
                        <a
                            data-sveltekit-reload
                            href="/block/{transaction.slot}?network={isMainnetValue ? 'mainnet' : 'devnet'}"
                            class="pointer-events-auto text-xs hover:link-success md:text-sm"
                        >
                            {transaction.slot?.toLocaleString()}
                        </a>
                    </div>
                </div>
            </div>

            <div class="mb-3 px-3">
                <Collapse 
                    sectionTitle="Transaction Data" 
                    sectionAditionalInfo="Raw transaction information"
                    showDetails={false} 
                    iconId="json"
                >
                    <div class="mb-3">
                        {#if transactionData}
                            <JSON data={transactionData} label="transaction" />
                        {:else}
                            <p>No transaction data available</p>
                        {/if}
                    </div>
                </Collapse>
            </div>

            {#if transaction.meta?.logMessages}
                <div class="mb-3 px-3">
                    <Collapse 
                        sectionTitle="Log Messages" 
                        sectionAditionalInfo="Program execution logs"
                        showDetails={false} 
                        iconId="info"
                    >
                        <LogMessages logs={transaction.meta.logMessages} />
                    </Collapse>
                </div>
            {/if}
        </div>
    {/if}
{:else}
    <h2 class="mb-6 mt-20 text-center text-lg opacity-90">
        Transaction not found. Try selecting another network.
    </h2>
    <Network />
{/if}