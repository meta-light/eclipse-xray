<script lang="ts">
    import { page } from "$app/stores";
    import { trpcWithQuery } from "$lib/trpc/client";
    import { onMount } from "svelte";
    import { Connection, PublicKey } from "@solana/web3.js";
    import { TldParser } from "@onsol/tldparser";
    import { getRPCUrl } from "$lib/utils";
    export let address: string;
    let username: string | null = null;
    let isLoading = true;
    const client = trpcWithQuery($page);
    async function fetchAllDomainsUsername(address: string) {
        const rpcUrl = getRPCUrl("mainnet");
        const connection = new Connection(rpcUrl);
        const parser = new TldParser(connection);
        try {
            const pubkey = new PublicKey(address);
            const allUserDomains = await parser.getAllUserDomains(pubkey);
            if (allUserDomains.length > 0) {username = allUserDomains[0].toString();}
        } 
        catch (error) {console.error("Error fetching AllDomains username:", error);} 
        finally {isLoading = false;}
    }
    onMount(() => {fetchAllDomainsUsername(address);});
</script>

<slot {username} {isLoading} />
