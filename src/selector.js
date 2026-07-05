import { client, routerModel } from "./anthropic.js";
import { buildRoutingPrompt } from "./prompts.js";
import { extractText, retryWithBackoff } from "./utils.js";

export async function selectSkills(userPrompt, skills) {
    const catalog = skills
        .map(
            (skill) =>
                `Name: ${skill.name}\nDescription: ${skill.description}`
        )
        .join("\n\n");

    const response = await retryWithBackoff(() =>
        client.messages.create({
            model: routerModel,
            max_tokens: 100,
            messages: [
                {
                    role: "user",
                    content: buildRoutingPrompt(catalog, userPrompt),
                },
            ],
        })
    );

    return extractText(response);
}
