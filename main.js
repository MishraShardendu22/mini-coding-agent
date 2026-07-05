import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { startCli } from "./src/cli.js";
import { discoverSkills } from "./src/skills.js";
dotenv.config();

const apiKey = process.env.API_KEY;
if (!apiKey) {
    throw new Error("API_KEY is not set");
}

const agentModel = process.env.AGENT_MODEL || process.env.MODEL || process.env.ROUTER_MODEL;
const routerModel = process.env.ROUTER_MODEL || process.env.MODEL || process.env.AGENT_MODEL;

if (!routerModel || !agentModel) {
    throw new Error(
        "No model configured. Set MODEL, ROUTER_MODEL, or AGENT_MODEL."
    );
}

const client = new Anthropic({
    apiKey,
    baseURL: "https://openrouter.ai/api",
});

const config = {
    client,
    agentModel,
    routerModel,
};

try {
    const skills = discoverSkills();
    startCli(skills, config);
} catch (err) {
    console.error(err);
    process.exit(1);
}