<script lang="ts">
    import { hideModal } from "$lib/modals";
    import { transactionActionsMetadata } from "$lib/ui";
    import { filterStore } from "$lib/stores";
    const handleClick = (key: string) => {$filterStore = key; hideModal();};
    const filterEntries = Object.entries(transactionActionsMetadata);
    $: filterList = filterEntries.filter(([key, value]) => value.filterLabel);
</script>

<button class="btn-ghost btn w-full" on:click={() => handleClick("")}>All Transactions</button>
{#each filterList as [key, value]}
    <button class="btn-ghost btn w-full" on:click={() => handleClick(key)}>{value.filterLabel}</button>
{/each}
