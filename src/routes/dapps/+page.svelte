<script lang="ts">
    import Icon from "$lib/components/icon.svelte";
    import featuredDapps from "../../lib/dapps.json";
    const networks = ["mainnet", "testnet", "devnet", "pre-launch"] as const;
    let selectedNetwork: typeof networks[number] = "mainnet";
    const shuffleArray = <T>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];}
        return shuffled;
    };
    $: filteredDapps = shuffleArray(featuredDapps.filter(dapp => dapp.network === selectedNetwork));
    const formatNetwork = (network: string) => {return network === "pre-launch" ? "Pre Launch" : network.charAt(0).toUpperCase() + network.slice(1);};
</script>

<div class="container mx-auto px-4 py-12">
    <h1 class="text-3xl font-bold text-center mb-8 mt-4">ECLIPSE DAPPS</h1>
    
    <div class="flex justify-center gap-4 mb-12">
        {#each networks as network}
            <button class="px-4 py-2 rounded-lg transition-colors {selectedNetwork === network ? 'bg-blue-600 text-white font-bold text-lg' : 'bg-gray-100 hover:bg-gray-200 font-bold text-lg'}" on:click={() => selectedNetwork = network}>
                {formatNetwork(network)}
            </button>
        {/each}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {#each filteredDapps as dapp}
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
    <div class="flex justify-center mt-8">
        <a href="https://www.eclipse.xyz/ecosystem" target="_blank" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">View More</a>
    </div>
</div> 