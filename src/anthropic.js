import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const apiKey = process.env.API_KEY;

if (!apiKey) {
    throw new Error("API_KEY is not set");
}

const routerModel = process.env.ROUTER_MODEL || process.env.MODEL || process.env.AGENT_MODEL;
const agentModel = process.env.AGENT_MODEL || process.env.MODEL || process.env.ROUTER_MODEL;

if (!routerModel || !agentModel) {
    throw new Error(
        "No model configured. Set MODEL, ROUTER_MODEL, or AGENT_MODEL."
    );
}

const client = new Anthropic({
    apiKey,
    baseURL: "https://openrouter.ai/api",
});

export { client, routerModel, agentModel };
