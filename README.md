# 🧱Eclipse XRAY
🔗 **Forked from**: https://github.com/helius-labs/xray
Eclipse XRAY is a modified fork of the Helius Labs Solana Explorer adapted to work with Eclipse Mainnet. 

Eclipse XRAY leverages only the Eclipse public [RPC](https://docs.eclipse.xyz/developers/rpc-and-block-explorers) endpoints, [Pyth](https://docs.eclipse.xyz/developers/oracles/pyth-network) for price feeds, [All Domains](https://docs.eclipse.xyz/developers/web3-domains/alldomains) for username discovery, and [Dune](https://dune.com/hkey/eclipse-mainnet-bridge) to gather statistics from the [Eclipse Mainnet Bridge](https://etherscan.io/address/0x83cB71D80078bf670b3EfeC6AD9E5E6407cD0fd1).

Contributions are welcome and encouraged! Learn more at [CONTRIBUTIONS.md](CONTRIBUTIONS.md)

### Tech Stack
[Node](https://nodejs.org/en/), [TurboRepo](https://turbo.build/repo), [TypeScript](https://www.typescriptlang.org/), [Prisma](https://www.prisma.io/), [tRPC](https://trpc.io/), [SvelteKit](https://kit.svelte.dev/), [TanstackQuery](https://tanstack.com/query/latest), [SvelteKit tRPC SvelteQuery Adapter](https://github.com/vishalbalaji/trpc-svelte-query-adapter), [Tailwind](https://tailwindcss.com/), [DaisyUI Components](https://daisyui.com/), [TailwindCSS](https://tailwindcss.com/), [DaisyUI](https://daisyui.com/)

### Setup Environment
In the root of the project, create a `.env` file with the following contents:
```sh
DUNE_KEY=<YOUR_DUNE_KEY>
FLIPSIDE_API_KEY=<YOUR_FLIPSIDE_API_KEY>
```
This is only required for Mainnet Bridge stats.

### Install
1. Run the install command from the root of the project to install dependencies for all apps and packages: 
```sh
npm install
```
2. Start all packages and apps in dev mode which watches for changes and adds your local environment.
```sh
npm run dev
```
3. Build all apps and packages for production.
```sh
npm run build
```

## Important Files & Folders
|                           |                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 📁 `./src/lib`            | Common components, utilities, and libraries used throughout the app. Import things from this directory using the `$lib/` alias. |
| 📁 `./src/lib/components` | Shared components used throughout the app.                                                                                      |
| 📁 `./src/lib/trpc`       | The tRPC server which has all of our backend endpoints.                                                                         |
| 📁 `./src/lib/types`      | Global types                                                                                                                    |
| 📁`./src/routes`          | Any `+page` or `+server` file in this directory becomes a page or an endpoint based on the folder structure.                    |