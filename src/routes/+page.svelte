<style>.intro {min-height: 65vh;}</style>

<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "$lib/components/icon.svelte";
    import Search from "$lib/components/search.svelte";
    import IntersectionObserver from "svelte-intersection-observer";
    import featuredDapps from "../lib/dapps.json";
    let searchError = "";
    let exploreELement: HTMLElement;
    let isFocused = false;
    let clearSearch = () => null;
    let focusInput = () => null;
    onMount(() => {setTimeout(() => {focusInput();}, 100);});
    const mainnetDapps = featuredDapps.filter(dapp => dapp.network === "mainnet");
    const randomMainnetDapps: any[] = [];
    while (randomMainnetDapps.length < 3 && mainnetDapps.length > 0) {
        const randomIndex = Math.floor(Math.random() * mainnetDapps.length);
        randomMainnetDapps.push(mainnetDapps.splice(randomIndex, 1)[0]);
    }
</script>

<div class="intro relative flex h-screen w-full items-center">
    <div style="background-image: url(/media/gradient.png);" class="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 bg-cover bg-center" />
    <div class="mx-auto w-full max-w-2xl md:-translate-y-1/4">
        <div class="mb-10">
            <h1 class="text-center text-9xl font-bold text-transparent bg-clip-text bg-black">ECLIPSE XRAY</h1>
        </div>
        <div class="relative w-full px-3">
            <Search size="lg" {searchError} bind:focusInput bind:clearSearch on:focusin={() => (isFocused = true)} on:focusout={() => (isFocused = false)} />
        </div>
    </div>
</div>

<IntersectionObserver once={true} rootMargin="100px" element={exploreELement}>
    <section class="mx-auto mb-20 max-w-6xl py-10">
        <h2 class="text-3xl font-bold text-center mb-8">FEATURED MAINNET DAPPS</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-5">
            {#each randomMainnetDapps as dapp}
                <div class="flex flex-col items-center p-6 space-y-4 rounded-lg border hover:shadow-lg transition-shadow">
                    <div class="h-16 w-16 rounded-full bg-gray-100 overflow-hidden">
                        {#if dapp.icon}
                            <img src={dapp.icon} alt={`${dapp.name} icon`} class="w-full h-full object-cover" />
                        {:else}
                            <div class="flex h-full w-full items-center justify-center">
                                <Icon id="image" size="lg"/>
                            </div>
                        {/if}
                    </div>
                    <h3 class="text-xl font-bold">{dapp.name}</h3>
                    <p class="text-black text-center">{dapp.description}</p>
                    <a href={dapp.link} class="text-blue-600 hover:underline">Learn More</a>
                </div>
            {/each}
        </div>
    </section>
</IntersectionObserver>
