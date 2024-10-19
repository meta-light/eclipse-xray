<script lang="ts">
    import type { UITokenMetadata } from "$lib/types";
    import { trpcWithQuery } from "$lib/trpc/client";
    import { page } from "$app/stores";
    import IntersectionObserver from "svelte-intersection-observer";

    const ETH = 'So11111111111111111111111111111111111111112'; // ETH address on your Solana fork

    export let address: string | undefined = undefined;
    export let token: any | undefined = undefined;
    export let status: { isLoading: boolean; isError: boolean } | undefined = undefined;
    let intersecting = false;
    const isMainnetValue = $page.url.searchParams.get("network") !== "devnet";

    const client = trpcWithQuery($page);

    $: tokenQuery = address && address !== ETH ? client.token.createQuery([address, isMainnetValue]) : null;

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

    let isNFT = false;

    $: if (tokenQuery) {
        console.log(`Query state for token ${address}:`, $tokenQuery);
    }

    $: if (tokenQuery && $tokenQuery.data) {
        const result = $tokenQuery.data;
        isNFT = result.decimals === 0 || result.decimals === undefined;
        
        metadata.address = result.address;
        metadata.name = result.metadata?.name || "Unknown Token";
        metadata.image = result.externalMetadata?.image || `/media/tokens/${result.metadata?.symbol?.toLowerCase() || 'unknown'}.png`;
        token = { ...result, address };
        status = { isLoading: false, isError: false };
        
        if (isNFT) {
            console.log(`Token ${address} is an NFT.`);
        } else {
            console.log(`Token ${address} is not an NFT. Decimals: ${result.decimals}`);
        }
    } else if (tokenQuery && $tokenQuery.error) {
        console.error(`Error fetching token data for ${address}:`, $tokenQuery.error);
        status = { isLoading: false, isError: true };
    } else if (tokenQuery) {
        status = { isLoading: true, isError: false };
    }

    $: if (address === ETH) {
        metadata.name = "ETH";
        metadata.image = "/media/tokens/ethereum.svg";
        metadata.address = ETH;
        token = {
            address: ETH,
            decimals: 9,
            isToken2022: false,
            metadata: {
                name: "Ethereum",
                symbol: "ETH",
                uri: "",
            },
        };
        status = { isLoading: false, isError: false };
        isNFT = false;
    }

    let element: HTMLDivElement;
    $: tokenIsLoading = status?.isLoading;
    $: tokenFailed = status?.isError;
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
                {token}
            />
        {/if}
    </IntersectionObserver>
</div>
