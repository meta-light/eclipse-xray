<script lang="ts">
    import { type UITokenMetadata } from "$lib/types";
    import { trpcWithQuery } from "$lib/trpc/client";
    import { page } from "$app/stores";
    import IntersectionObserver from "svelte-intersection-observer";
    import { ETH } from "$lib/config";
    import { createEventDispatcher } from 'svelte';
    export let address: string | undefined = undefined;
    export let token: any | undefined = undefined;
    export let status: { isLoading: boolean; isError: boolean } | undefined = undefined;
    let localMetadata: UITokenMetadata = {address: '', name: '', image: '', collectionKey: '', owner: ''};
    let intersecting = false;
    const isMainnetValue = $page.url.searchParams.get("network") !== "devnet";
    const client = trpcWithQuery($page);
    $: tokenQuery = address && address !== ETH ? client.token.createQuery([address, isMainnetValue]) : null;
    let isNFT = false;
    $: if (address === ETH) {
        localMetadata = {
            name: "ETH", 
            image: "/media/tokens/ethereum.svg", 
            address: ETH, 
            collectionKey: "", 
            owner: ""
        };
        token = {
            address: ETH, 
            decimals: 9, 
            isToken2022: false, 
            metadata: {name: "Ethereum", symbol: "ETH", uri: ""}
        };
        status = { isLoading: false, isError: false };
        isNFT = false;
        
        if (previousLoadingState !== false) {
            dispatch('metadataLoading', false);
            previousLoadingState = false;
        }
    }
    else if (tokenQuery && (($tokenQuery ?? {}).data ?? null)) {
        const result = $tokenQuery!.data;
        if (result) {
            isNFT = result.decimals === 0 || result.decimals === undefined;
            localMetadata = {
                address: result.address,
                name: result.metadata?.name || "Unknown Token",
                image: (result.externalMetadata as { image?: string })?.image || "",
                collectionKey: (result as any).collectionKey || "",
                owner: (result as any).owner || ""
            };
            token = { ...result, address };
            status = { isLoading: false, isError: false };
            
            if (previousLoadingState !== false) {
                dispatch('metadataLoading', false);
                previousLoadingState = false;
            }
        }
    } 
    else if (tokenQuery && $tokenQuery?.error) {
        console.error(`Error fetching token data for ${address}:`, $tokenQuery.error);
        status = { isLoading: false, isError: true };
        
        if (previousLoadingState !== false) {
            dispatch('metadataLoading', false);
            previousLoadingState = false;
        }
    } 
    else if (tokenQuery) {
        status = { isLoading: true, isError: false };
        
        if (previousLoadingState !== true) {
            dispatch('metadataLoading', true);
            previousLoadingState = true;
        }
    }
    let element: HTMLDivElement;
    $: tokenIsLoading = status?.isLoading;
    $: tokenFailed = status?.isError;

    const dispatch = createEventDispatcher();
    let previousLoadingState: boolean | undefined = undefined;

    $: {
        const currentLoadingState = status?.isLoading;
        if (currentLoadingState !== previousLoadingState) {
            dispatch('metadataLoading', currentLoadingState);
            previousLoadingState = currentLoadingState;
        }
    }
</script>

<div>
    <IntersectionObserver once={true} {element} bind:intersecting>
        <div bind:this={element} />
        {#if intersecting}
            <slot 
                metadata={localMetadata} 
                {tokenIsLoading} 
                {tokenFailed} 
                {isNFT} 
                {token}
            />
        {/if}
    </IntersectionObserver>
</div>