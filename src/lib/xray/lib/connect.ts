import { Connection } from "@solana/web3.js";

const networks = {
    devnet: `https://staging-rpc.dev2.eclipsenetwork.xyz/`,
    mainnet: `https://mainnetbeta-rpc.eclipse.xyz`,
    solanaMainnet: "https://mainnetbeta-rpc.eclipse.xyz",
};

export type Network = keyof typeof networks;

export const connect = (network: Network = "mainnet") => {
    let url = networks[network];
    return new Connection(url, "confirmed");
};
