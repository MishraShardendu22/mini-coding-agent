import { buildRoutingPrompt } from "./prompts.js";
import retryWithBackoff, { extractText } from "./utils.js";

export async function selectSkills(userPrompt, skills, config) {
    const catalog = skills
        .map(
            (skill) =>
                `Name: ${skill.name}\nDescription: ${skill.description}`
        )
        .join("\n\n");

    const response = await retryWithBackoff(() =>
        config.client.messages.create({
            model: config.routerModel,
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
