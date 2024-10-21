// import { PullFeed, loadLookupTables } from "@switchboard-xyz/on-demand";
// import { PublicKey } from "@solana/web3.js";
// import anchor from "@coral-xyz/anchor";

// const provider = "..."

// // Initialize the program state account
// const idl = (await anchor.Program.fetchIdl(new PublicKey("SBondMDrcV3K4kxZR1HNVT7osZxAHVHgYXL5Ze1oMUv"), provider))!;
// const program = new anchor.Program(idl, provider);

// // Get the Pull Feed - (pass in the feed pubkey)
// const pullFeed = new PullFeed(program, new PublicKey("SomeFeedPubkey"));

// // Get the update for the pull feed
// const [pullIx, responses, _, luts] = await pullFeed.fetchUpdateIx({ chain: "eclipse", network: "mainnet"});
