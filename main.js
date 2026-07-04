import dotenv from "dotenv";
dotenv.config();

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.API_KEY;
const model = process.env.MODEL;

if (!apiKey) {
    throw new Error("API_KEY is not set");
}

if (!model) {
    throw new Error("MODEL is not set");
}

const client = new Anthropic({
    apiKey,
    baseURL: "https://openrouter.ai/api",
});

const SKILLS_DIR = ".skills";

function loadSkillMetadata(skillFilePath) {
    const content = fs.readFileSync(skillFilePath, "utf8");

    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

    if (!match) {
        throw new Error(`Invalid SKILL.md: ${skillFilePath}`);
    }

    const metadata = {};

    for (const line of match[1].split(/\r?\n/)) {
        const idx = line.indexOf(":");

        if (idx === -1) continue;

        const key = line.slice(0, idx).trim();
        const value = line
            .slice(idx + 1)
            .trim()
            .replace(/^"(.*)"$/, "$1");

        metadata[key] = value;
    }

    return {
        name: metadata.name,
        description: metadata.description,
        path: skillFilePath,
    };
}

function discoverSkills() {
    if (!fs.existsSync(SKILLS_DIR)) {
        throw new Error(`Directory '${SKILLS_DIR}' not found.`);
    }

    const skills = [];

    const entries = fs.readdirSync(SKILLS_DIR, {
        withFileTypes: true,
    });

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const skillFile = path.join(SKILLS_DIR, entry.name, "SKILL.md");

        if (!fs.existsSync(skillFile)) continue;

        skills.push(loadSkillMetadata(skillFile));
    }

    return skills;
}

async function selectSkills(userPrompt, skills) {
    const catalog = skills
        .map(
            (skill) =>
                `Name: ${skill.name}\nDescription: ${skill.description}`
        )
        .join("\n\n");

    const response = await client.messages.create({
        model,
        max_tokens: 100,
        messages: [
            {
                role: "user",
                content: `You are an expert Agent Skills router.

Your ONLY responsibility is to decide which Agent Skills should be loaded.

You DO NOT answer the user's question.

A request may require:
- zero skills
- one skill
- multiple skills

Always prefer selecting a relevant skill over returning NONE.

Available Skills

${catalog}

Examples

User:
I'm new here.

Output:
welcome-me

User:
How do I contribute?

Output:
contribution-guide

User:
Can you review my PR?

Output:
pr-judge

User:
I'm new here. How do I contribute?

Output:
welcome-me,contribution-guide

User:
Explain binary search.

Output:
NONE

User Request

${userPrompt}

Rules

- Return ONLY skill names.
- Use the exact skill names shown above.
- Multiple skills must be comma separated.
- Never explain.
- Never use markdown.
- Never output anything except skill names.
- If absolutely no skill applies, return:
NONE`,
            },
        ],
    });

    return response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("")
        .trim();
}

function loadSkillContent(skill) {
    return fs.readFileSync(skill.path, "utf8");
}

async function runAgent(userPrompt, matchedSkills) {
    let systemPrompt = `You are a coding assistant implementing the Agent Skills specification.

The correct skills have already been selected.

Rules:

- Obey every loaded skill.
- HARD REQUIREMENTS are mandatory.
- Reproduce required output exactly when specified.
- Do not ignore loaded skills.
- If no skills are loaded, answer normally.

`;

    if (matchedSkills.length > 0) {
        systemPrompt += "\nLoaded Skills:\n\n";

        for (const skill of matchedSkills) {
            systemPrompt += `
========================================
SKILL: ${skill.name}
========================================

${loadSkillContent(skill)}

========================================
END SKILL
========================================

`;
        }
    }

    const response = await client.messages.create({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
            {
                role: "user",
                content: userPrompt,
            },
        ],
    });

    return response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("")
        .trim();
}

async function processPrompt(userPrompt, skills) {
    const selected = await selectSkills(userPrompt, skills);

    const selectedNames =
    selected.toUpperCase() === "NONE"
        ? []
        : selected
              .split(",")
              .map((s) =>
                  s
                      .trim()
                      .toLowerCase()
                      .replace(/["'`]/g, "")
              )
              .filter(Boolean);

    const matchedSkills = skills.filter((skill) =>
        selectedNames.includes(skill.name.toLowerCase())
    );

    const response = await runAgent(userPrompt, matchedSkills);

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
}

async function main() {
    const skills = discoverSkills();

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

main().catch((err) => {
    console.error(err);
    process.exit(1);
});