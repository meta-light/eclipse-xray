<script lang="ts">
    import { page } from "$app/stores";
    import { trpcWithQuery } from "$lib/trpc/client";
    import { onMount } from "svelte";
    import { Connection, PublicKey } from "@solana/web3.js";
    import { TldParser } from "@onsol/tldparser";
    import { getRPCUrl } from "$lib/util/get-rpc-url";

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
            
            console.log("All domains owned by this address:", allUserDomains);

            if (allUserDomains.length > 0) {
                username = allUserDomains[0].toString();
                // console.log("First AllDomains username:", username);
            } else {
                // console.log("No AllDomains username found for this address");
            }
        } catch (error) {
            console.error("Error fetching AllDomains username:", error);
        } finally {
            isLoading = false;
        }
    }

    onMount(() => {
        fetchAllDomainsUsername(address);
    });
</script>

<slot {username} {isLoading} />
