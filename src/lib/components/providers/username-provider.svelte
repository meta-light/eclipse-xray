<script lang="ts">
    import { page } from "$app/stores";
    import { trpcWithQuery } from "$lib/trpc/client";
    import { onMount } from "svelte";
    import { Connection, PublicKey } from "@solana/web3.js";
    import { TldParser } from "@onsol/tldparser";
    import { getRPCUrl } from "$lib/utils";
    export let address: string;
    let usernames: string[] = [];
    let isLoading = true;
    const client = trpcWithQuery($page);

    async function fetchAllDomainsUsername(address: string) {
        const rpcUrl = getRPCUrl("mainnet");
        const connection = new Connection(rpcUrl);
        const parser = new TldParser(connection);
        try {
            const pubkey = new PublicKey(address);
            const allUserDomains = await parser.getParsedAllUserDomains(pubkey);
            usernames = allUserDomains.map(domain => domain.domain.toString());
        } 
        catch (error) {console.error("Error fetching AllDomains username:", error);} 
        finally {isLoading = false;}
    }

    onMount(() => {fetchAllDomainsUsername(address);});
</script>

<slot {usernames} {isLoading} />