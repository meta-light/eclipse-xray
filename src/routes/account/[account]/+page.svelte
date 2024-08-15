<script lang="ts">
    import { page } from "$app/stores";
    import Transactions from "$lib/components/transactions.svelte";
    import { filterStore } from "$lib/util/stores/filter";
    const { account } = $page.params;
</script>

<div class="pl-2 md:pl-0">
    <Transactions {account} filter={$filterStore} user={account}/>
</div>