import readline from "node:readline";
import { processPrompt } from "./agent.js";

export function startCli(skills) {
    console.log("Mini Coding Agent");
    console.log("=================");
    console.log(`Loaded ${skills.length} skills.`);
    console.log("Type 'exit' or 'quit' to quit.\n");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: "> ",
    });

    rl.prompt();

    rl.on("line", async (line) => {
        const input = line.trim();

        if (!input) {
            rl.prompt();
            return;
        }

        if (
            input.toLowerCase() === "exit" ||
            input.toLowerCase() === "quit"
        ) {
            rl.close();
            return;
        }

        try {
            await processPrompt(input, skills);
        } catch (err) {
            console.error("\nError:", err.message);
        }

        rl.prompt();
    });

    rl.on("close", () => {
        console.log("\nGoodbye.");
        process.exit(0);
    });

    process.on("SIGINT", () => {
        rl.close();
    });
}
