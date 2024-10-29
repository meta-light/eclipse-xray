<script lang="ts">
    import Icon from "$lib/components/icon.svelte";
    import type { Icon as IconType, NullableProp } from "$lib/types";
    export let iconId = "" as IconType;
    export let sectionTitle: string = "";
    export let sectionAditionalInfo: NullableProp<string | number> = null;
    export let showDetails = true;
</script>

<div class="collapse-arrow collapse rounded-lg border">
    <input type="checkbox" bind:checked={showDetails} />
    <div class="collapse-title grid grid-cols-12 items-center gap-3 p-1 py-3">
        <div class="col-span-2 p-1 md:col-span-1">
            <div class="center ml-1 h-10 w-10 rounded-full bg-gray-200"><Icon id={iconId} size="sm" fill="black" stroke=""/></div>
        </div>
        <div class="col-span-10 flex items-center justify-between pr-1 md:col-span-11">
            <div>
                <h4 class="text-lg font-semibold md:text-sm">{sectionTitle}</h4>
                {#if sectionAditionalInfo}<h3 class="mr-2 text-xs opacity-50">{sectionAditionalInfo}</h3>{/if}
            </div>
        </div>
    </div>
    <div class="collapse-content"><slot/></div>
</div>