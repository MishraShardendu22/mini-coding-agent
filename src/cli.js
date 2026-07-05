import readline from "node:readline";
import { processPrompt } from "./agent.js";

// quick prompts
const QUICK_PROMPTS = [
    "Hello! I'm new here, introduce me to the project.",
    "How do I contribute to this codebase?",
    "Can you review and judge my pull request?",
    "I'm new here. How do I contribute? Also review my PR.",
];

// print the default menu of quick prompts
function printMenu() {
    console.log("Quick prompts:");
    for (let i = 0; i < QUICK_PROMPTS.length; i++) {
        console.log(`  [${i + 1}] ${QUICK_PROMPTS[i]}`);
    }
    console.log("\nType a number to select, or type your own prompt.\n");
}

export function startCli(skills) {
    console.log("Mini Coding Agent");
    console.log("=================");
    console.log(`Loaded ${skills.length} skills.`);
    console.log("Type 'exit' or 'quit' to quit.\n");

    printMenu();

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

        // Check if input is a quick prompt number
        const num = parseInt(input, 10);
        const prompt =
            num >= 1 && num <= QUICK_PROMPTS.length
                ? QUICK_PROMPTS[num - 1]
                : input;

        if (prompt !== input) {
            console.log(`\n> ${prompt}`);
        }

        let interval;
        try {
            process.stdout.write("\nGetting data");
            let dots = 0;
            interval = setInterval(() => {
                process.stdout.write(".");
                dots++;
                if (dots > 3) {
                    readline.cursorTo(process.stdout, 0);
                    readline.clearLine(process.stdout, 0);
                    process.stdout.write("Getting data");
                    dots = 0;
                }
            }, 500);

            const { matchedSkills, response } = await processPrompt(prompt, skills);
            
            clearInterval(interval);
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);

            console.log("\n----------------------------------------");
            console.log("Matched Skills:");
            console.log(
                matchedSkills.length
                    ? matchedSkills.map((s) => s.name).join(", ")
                    : "None"
            );

            console.log("\nResponse:\n");
            console.log(response);
            console.log("----------------------------------------\n");

        } catch (err) {
            if (interval) clearInterval(interval);
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
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
