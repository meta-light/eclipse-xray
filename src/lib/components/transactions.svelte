<script lang="ts">
    //@ts-nocheck
    import { page } from "$app/stores";
    import type { ProtonTransaction } from "$lib/types";
    import { trpcWithQuery } from "$lib/trpc/client";
    import { fly } from "svelte/transition";
    import IconCard from "$lib/components/icon-card.svelte";
    import Transaction from "$lib/components/transaction.svelte"
    export let account: string;
    export let user = "";
    export let filter = "";
    let cachedAddress = "";
    const client = trpcWithQuery($page);
    const params = new URLSearchParams(window.location.search);
    const network = params.get("network");
    const isMainnetValue = network !== "devnet";
    const createTransactionQuery = (input: {account: string; filter: string; user: string; cursor?: string; isMainnet: boolean;}) => client.transactions.createInfiniteQuery(input, {getNextPageParam: (lastPage) => lastPage.oldest, refetchOnMount: false, refetchOnWindowFocus: false,});
    const loadMore = () => {$transactions.fetchNextPage();};
    $: transactions = createTransactionQuery({account, filter, isMainnet: isMainnetValue, user,});
    $: transactionPages = ($transactions.data?.pages || []) as {result: ProtonTransaction[]; oldest: string | null;}[];
    $: if (cachedAddress !== account) {cachedAddress = account; transactions = createTransactionQuery({account, filter, isMainnet: isMainnetValue, user,});}
    $: lastPage = transactionPages[transactionPages.length - 1];
    $: lastPageHasTransactions = lastPage ? lastPage.result?.length > 0 : false;
</script>
{#if $transactions.isLoading}
    {#each Array(3) as _}
        <div class="py-2">
            <IconCard />
        </div>
    {/each}
{:else if transactionPages.length === 1 && !lastPageHasTransactions}
    <p class="opacity-50">No transactions</p>
    {:else}
    {#each transactionPages as transactionsList}
        {#each transactionsList.result as transaction, idx (transaction.signature)}
            {#if transaction && transaction.signature != null}
                {#if idx < 8}
                    <div class="mb-8" in:fly={{delay: idx * 100, duration: 500, y: 30}}>
                        <Transaction {transaction} />
                    </div>
                {:else}
                    <div class="mb-10">
                        <Transaction {transaction} />
                    </div>
                {/if}
            {/if}
        {/each}
    {/each}
{/if}
{#if $transactions.hasNextPage && lastPageHasTransactions}
    <div class="flex justify-center">
        <button class="btn-outline btn" class:loading={$transactions.isFetching} class:disabled={$transactions.isFetching} on:click={loadMore}>Load More</button>
    </div>
{/if}