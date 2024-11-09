import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";
import pkg from "./package.json";
import path from "path";

export default defineConfig(({ mode }) => ({
    build: {
        target: "es2020",
        rollupOptions: {
            external: ['crypto']
        }
    },
    define: {
        APP_NAME: JSON.stringify(pkg.name),
        APP_VERSION: JSON.stringify(pkg.version),
        "process.env.NODE_DEBUG": false,
        'global.crypto': 'crypto',
        'global.Buffer': 'Buffer'
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
                    crypto: true
                })
            ],
            target: "es2020",
        },
        include: ['buffer']
    },
    plugins: [
        sveltekit(),
        NodeModulesPolyfillPlugin(),
        NodeGlobalsPolyfillPlugin({
            buffer: true,
            process: true,
            crypto: true
        })
    ],
    resolve: {
        alias: {
            $lib: path.resolve("./src/lib"),
            crypto: 'crypto-browserify',
            stream: 'stream-browserify',
            assert: 'assert',
            http: 'stream-http',
            https: 'https-browserify',
            os: 'os-browserify',
            url: 'url',
            buffer: 'buffer'
        }
    }
}));
