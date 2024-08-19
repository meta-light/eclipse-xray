<script lang="ts">
    import { page } from "$app/stores";
    import { trpcWithQuery } from "$lib/trpc/client";
    import { onMount } from "svelte";
    import { TldParser } from "@onsol/tldparser";
    import { Connection, PublicKey } from "@solana/web3.js";
    export let address: string;
    let username: string | null = null;
    let isLoading = true;
    const client = trpcWithQuery($page);
    const RPC_URL = 'https://mainnetbeta-rpc.eclipse.xyz';
    const connection = new Connection(RPC_URL);
    async function fetchAllDomainsUsername(address: string) {
        const parser = new TldParser(connection);
        try {
            const pubkey = new PublicKey(address);
            const allUserDomains = await parser.getAllUserDomains(pubkey);
            if (allUserDomains.length > 0) {username = allUserDomains[0].toString(); isLoading = false;}
        } 
        catch (error) {console.error("Error fetching AllDomains username:", error); isLoading = false;}
    }
    onMount(() => {fetchAllDomainsUsername(address);});
</script>
<slot username={username} {isLoading} />