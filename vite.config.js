import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";
import pkg from "./package.json";
import path from "path";

export default defineConfig(({ mode }) => ({
    build: {
        target: "es2020",
    },

    define: {
        APP_NAME: JSON.stringify(pkg.name),
        APP_VERSION: JSON.stringify(pkg.version),
        "process.env.NODE_DEBUG": false,
    },

    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: 'globalThis'
            },
            plugins: [
                NodeGlobalsPolyfillPlugin({
                    buffer: true,
                    process: true,
                })
            ],
            target: "es2020",
        },
    },

    plugins: [
        sveltekit(),
        NodeModulesPolyfillPlugin(),
        NodeGlobalsPolyfillPlugin({
            buffer: true,
            process: true,
        }),
    ],
    resolve: {
        alias: {
            $lib: path.resolve("./src/lib"),
            crypto: 'crypto-browserify',
            '@solana/spl-type-length-value': path.resolve('./node_modules/@solana/spl-type-length-value'),
            'src/crypto-shim.js': path.resolve('./src/crypto-shim.ts')
        },
    },
}));
