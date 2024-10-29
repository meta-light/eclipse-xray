<script>import Icon from "$lib/components/icon.svelte";</script>
<footer class="footer mt-0 grid w-full grid-cols-2 items-center border-t border-black bg-white p-3">
    <div class="col-span-1 flex items-center">
        <a class="btn-ghost btn flex items-center text-left" href="https://eclipse.xyz/" rel="noreferrer" target="_blank">
            <div class="relative mr-3">
                <h1 class="text-2xl">🧱</h1>
            </div>
            <div>
                <p class="m-0 text-xs font-normal text-black">Powered by</p>
                <strong class="m-0 text-black">BRICKS</strong>
            </div>
        </a>
    </div>
    <div class="col-span-1 flex w-full justify-end">
        <div class="mr-12">
            <a href="https://discord.com/invite/eclipse-labs" class="btn-ghost btn"><Icon id="discord" size="md" fill="black" /></a>
            <a href="https://x.com/EclipseFND" class="btn-ghost btn"><Icon id="twitter" size="md" fill="black" /></a>
        </div>
    </div>
</footer>