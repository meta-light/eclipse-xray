<script lang="ts">
    export let addresses: Array<string>;
    import { shortenString, } from "$lib/utils";
</script>
{#each addresses as address}<a href="/account/{address}" data-sveltekit-reload class="btn-ghost btn w-full">{shortenString(address, 8)}</a>{/each}