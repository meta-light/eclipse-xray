<script lang="ts">
    import type { UITokenMetadata } from "$lib/types";
    import { SOL } from "$lib/xray";
    import { getRPCUrl } from "$lib/util/get-rpc-url";
    import IntersectionObserver from "svelte-intersection-observer";

    export let address: string | undefined = undefined;
    export let token: any | undefined = undefined;
    export let status: { isLoading: boolean; isError: boolean } | undefined = undefined;
    let intersecting = false;
    const params = new URLSearchParams(window.location.search);
    const network = params.get("network");
    const isMainnetValue = network !== "devnet";

    export const metadata: UITokenMetadata = {
        address: "",
        attributes: [],
        collectionKey: "",
        creators: [],
        delegate: "",
        description: "",
        image: "",
        name: "",
        owner: "",
        sellerFeeBasisPoints: 0,
    };

    async function fetchTokenData() {
        if (!address) return;

        const rpcUrl = getRPCUrl(isMainnetValue ? "mainnet" : "devnet");
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getTokenAccountBalance',
                params: [address]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.result?.value;
    }

    $: if (address && address !== SOL) {
        fetchTokenData().then(data => {
            if (data) {
                metadata.address = address;
                metadata.name = data.symbol || "Unknown Token";
                metadata.image = `/media/tokens/${data.symbol?.toLowerCase() || 'unknown'}.svg`;
                token = { ...data, address };
                status = { isLoading: false, isError: false };
            }
        }).catch(error => {
            console.error("Error fetching token data:", error);
            status = { isLoading: false, isError: true };
        });
    } else if (address === SOL) {
        metadata.name = "ETH";
        metadata.image = "/media/tokens/ethereum.svg";
        metadata.address = SOL;
        status = { isLoading: false, isError: false };
    }

    let element: HTMLDivElement;
    $: tokenIsLoading = status?.isLoading;
    $: tokenFailed = status?.isError;
    $: isNFT = metadata?.attributes && metadata?.attributes?.length > 0;
</script>

<div>
    <IntersectionObserver once={true} {element} bind:intersecting>
        <div bind:this={element} />
        {#if intersecting}
            <slot
                {metadata}
                {tokenIsLoading}
                {tokenFailed}
                {isNFT}
            />
        {/if}
    </IntersectionObserver>
</div>