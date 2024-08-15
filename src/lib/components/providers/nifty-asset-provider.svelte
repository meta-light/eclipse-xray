<script lang="ts">
    import type { UINiftyAsset } from "$lib/types";
    import { SOL } from "$lib/xray";
    import { page } from "$app/stores";
    import { getRPCUrl } from "$lib/util/get-rpc-url";
    import IntersectionObserver from "svelte-intersection-observer";

    export let address: string | undefined = undefined;
    export let asset: UINiftyAsset | undefined = undefined;
    export let status: { isLoading: boolean; isError: boolean } = {isError: false, isLoading: true};

    let intersecting = false;
    const params = new URLSearchParams(window.location.search);
    const network = params.get("network");
    const isMainnetValue = network !== "devnet";

    async function fetchNFTData() {
        if (!address) return;

        const rpcUrl = getRPCUrl(isMainnetValue ? "mainnet" : "devnet");
        try {
            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getAsset',
                    params: [address]
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log("NFT data fetched:", result);
            return result.result;
        } catch (error) {
            console.error("Error fetching NFT data:", error);
            throw error;
        }
    }

    $: if (address) {
        fetchNFTData()
            .then(data => {
                if (data) {
                    asset = data;
                    status = { isLoading: false, isError: false };
                    console.log("NFT asset updated:", asset);
                }
            })
            .catch(error => {
                console.error("Error in fetchNFTData:", error);
                status = { isLoading: false, isError: true };
            });
    }

    let element: HTMLDivElement;
    $: loading = status.isLoading;
    $: failed = status.isError;
</script>

<div>
    <IntersectionObserver once={true} {element} bind:intersecting>
        <div bind:this={element}/>
        {#if intersecting}
            <slot
                {asset}
                {loading}
                {failed}
            />
        {/if}
    </IntersectionObserver>
</div>