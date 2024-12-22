import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction, TransactionInstruction, VersionedTransaction } from "@solana/web3.js";
import { SolanaAgentKit } from "../agent";
import bs58 from "bs58";
import dotenv from "dotenv";
dotenv.config();

export async function rps(
    agent: SolanaAgentKit,
    amount: number,
    choice: "rock" | "paper" | "scissors",
) {
    try {
        const connection = new Connection(clusterApiUrl("mainnet-beta"));
        const KEYPAIR = agent.wallet;
        const ADDRESS = KEYPAIR.publicKey;
        const res = await fetch(
            `https://rps.sendarcade.fun/api/actions/backend?amount=${amount}&choice=${choice}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    account: ADDRESS.toBase58(),
                }),
            },
        );

        const data = await res.json();
        console.log(data);
        if (data.transaction) {
            console.log(data.message);
            const txn = Transaction.from(Buffer.from(data.transaction, "base64"));
            txn.sign(KEYPAIR);
            txn.recentBlockhash = (
                await connection.getLatestBlockhash()
            ).blockhash;
            const sig = await sendAndConfirmTransaction(
                connection,
                txn,
                [KEYPAIR],
                { commitment: 'confirmed', skipPreflight: true }
            );
            let href = data.links?.next?.href;
            return outcome(agent,sig,href);
        } else {
            return "failed";
        }
    } catch (error: any) {
        console.error(error);
        throw new Error(`RPS game failed: ${error.message}`);
    }
}
async function outcome(agent: SolanaAgentKit, sig: string, href:string): Promise<string> {
    try {
        const KEYPAIR = agent.wallet;
        const ADDRESS = KEYPAIR.publicKey;
        const res = await fetch(
            `https://rps.sendarcade.fun${href}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    account: ADDRESS.toBase58(),
                    signature: sig,
                }),
            },
        );

        const data:any = await res.json();
        const title = data.title;
        if (title.startsWith("You lost")){
            return title;
        }
        let next_href = data.links?.actions?.[0]?.href;
        return title + "\n" + won(next_href)
    } catch (error: any) {
        console.error(error);
        throw new Error(`RPS outcome failed: ${error.message}`);
    }
}
async function won(href:string): Promise<string> {
    try {
        const connection = new Connection(clusterApiUrl("mainnet-beta"));
        const KEYPAIR = Keypair.fromSecretKey(bs58.decode(process.env.SOLANA_SENDER_SECRET!));;
        const ADDRESS = KEYPAIR.publicKey;
        const res = await fetch(
            `https://rps.sendarcade.fun${href}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    account: ADDRESS.toBase58(),
                }),
            },
        );

        const data:any = await res.json();
        if (data.transaction) {
            console.log(data.message);
            const txn = Transaction.from(Buffer.from(data.transaction, "base64"));
            txn.recentBlockhash = (
                await connection.getLatestBlockhash()
            ).blockhash;
            const sig = await sendAndConfirmTransaction(
                connection,
                txn,
                [KEYPAIR],
                { commitment: 'confirmed', skipPreflight: true }
            );
        }
        else {
            return "Failed to claim prize.";
        }
        let next_href = data.links?.next?.href;
        return postWin(next_href);
    } catch (error: any) {
        console.error(error);
        throw new Error(`RPS outcome failed: ${error.message}`);
    }
}
async function postWin(href:string): Promise<string> {
    try {
        const KEYPAIR = Keypair.fromSecretKey(bs58.decode(process.env.SOLANA_SENDER_SECRET!));;
        const ADDRESS = KEYPAIR.publicKey;
        const res = await fetch(
            `https://rps.sendarcade.fun${href}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    account: ADDRESS.toBase58(),
                }),
            },
        );

        const data:any = await res.json();
        const title = data.title;
        return "Prize claimed Successfully"+"\n"+title;
    } catch (error: any) {
        console.error(error);
        throw new Error(`RPS outcome failed: ${error.message}`);
    }
}