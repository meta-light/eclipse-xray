# Eclipse XRAY
Eclipse XRAY is a modified fork of the Helius Labs Solana Explorer adapted to work with Eclipse Mainnet. 

Eclipse XRAY leverages only the Eclipse public [RPC](https://docs.eclipse.xyz/developers/rpc-and-block-explorers) endpoints, [Pyth](https://docs.eclipse.xyz/developers/oracles/pyth-network) for price feeds, and [Dune](https://dune.com/hkey/eclipse-mainnet-bridge) to gather statstics from the [Eclipse Mainnet Bridge](https://etherscan.io/address/0x83cB71D80078bf670b3EfeC6AD9E5E6407cD0fd1).
## Relevant Links
🔗 **Froked from**: https://github.com/helius-labs/xray

### Tech Stack
-   [Node](https://nodejs.org/en/)
-   [TurboRepo](https://turbo.build/repo)
-   [TypeScript](https://www.typescriptlang.org/)
-   [Prisma](https://www.prisma.io/)
-   [tRPC](https://trpc.io/)
-   [SvelteKit](https://kit.svelte.dev/)
-   [TanstackQuery](https://tanstack.com/query/latest)
-   [SvelteKit tRPC SvelteQuery Adapter](https://github.com/vishalbalaji/trpc-svelte-query-adapter)
-   [Tailwind](https://tailwindcss.com/)
-   [DaisyUI Components](https://daisyui.com/)

### Setup Environment
In the root of the project, create a `.env` file with the values mentioned in `.env.template`.
The only environment variable used is a Dune API key for the bridge stats.

### Install
Run the install command from the root of the project to install dependencies for all apps and packages.
```
npm install
```
### Dev
Start all packages and apps in dev mode which watches for changes and adds your local environment.
```sh
npm run dev
```

### Build
Build all apps and packages for production.
```sh
npm run build
```

## Important Files & Folders
|                           |                                                                                                                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 📁 `./src/lib`            | Common components, utilities, and libraries used throughout the app. Import things from this directory using the `$lib/` alias.                                                                             |
| 📁 `./src/lib/trpc`       | The tRPC server which has all of our backend endpoints. See `trpc/routes`.                                                                                                                                  |
| 📁 `./src/lib/components` | Shared components used throughout the app.                                                                                                                                                                  |
| 📁 `./src/lib/trpc`       | The tRPC server which has all of our backend endpoints.                                                                                                                                                     |
| 📁 `./src/lib/types`      | Global types                                                                                                                                                                                                |
| 📁 `./src/lib/configs`    | Config definitions for things like the icons, modals, and generating other types.                                                                                                                           |
| 📁`./src/routes`          | Any `+page` or `+server` file in this directory becomes a page or an endpoint based on the folder structure.                                                                                                |
| 📁`./static`              | A place to put any static assets. The files in this directory are hosted at the root of the domain. When using images, try to import them in the `<script>` vs put them in `./static` when you can help it. |
| 📄`./app.postcss`         | Initialize/config Tailwind + global styles.                                                                                                                                                                 |
| 📄`./app.html`            | The top level HTML template that wraps all pages. Routes are injected into the `%sveltekit.body%` tag.                                                                                                     |

## Routes
|                    |                                                                                                                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                | Home                                                                                                                                                                                               |
| `/api`             | REST endpoints (This is mostly replaces by tRPC now)                                                                                                                                               |
| `/[search]`        | From the home page, users can navigate to `/anything` which attempts to resolve the search and then redirect them to `/[search]/tx`, `/[search]/wallet`, or `/[search]/token` based on the search. |
| `/[search]/tx`     | Details about a particular transaction where `[search]` is a transaction signature.                                                                                                                |
| `/[search]/wallet` | Details about a particular wallet where `[search]` is a public key.                                                                                                                                |
| `/[search]/token`  | Details about a particular token where `[search]` is a token mint address.                                                                                                                         |

## Vercel Config
|                 |                                                   |
| --------------- | ------------------------------------------------- |
| Build Command   | `cd ../.. && npx turbo run build --filter=web...` |
| Output Director | `apps/web/.svelte-kit`                            |
| Install Command | `npm install --prefix=../..`                      |

## Styles
[TailwindCSS](https://tailwindcss.com/) is used for base utilies and [DaisyUI](https://daisyui.com/) contains helpful UI components.


## Important Files & Folders
|                                         |                                                                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 📄`./src/lib/parser/index.ts`           | UI calls the function in this file to parse transactions                                                                                                             |
| 📄`./src/lib/parser/types.ts`           | Contains the types, interfaces, and enums needed to understand to work on the parser.                                                                                |
| 📁`./src/lib/parser/parsers`            | Contains all parser methods.                                                                                                                                         |
| 📄`./src/lib/parser/parsers/index.ts`   | Exports parser files in `./src/parsers`.                                                                                                                             |
| 📄`./src/lib/parser/parsers/unknown.ts` | If there is no dedicated parser file for a Helius transaction type, they are parsed in this file. Changing the label on the UI is in `./apps/web/src/lib/config.ts`. |
| 📁`./src/lib/parser/utils`              | Utility functions for the parser functions                                                                                                                           |
| 📄`./src/lib/search.ts`                 | The function that resolves search inputs to a URL parameter.                                                                                                         |
