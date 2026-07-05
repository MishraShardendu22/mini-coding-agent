import { client, agentModel } from "./anthropic.js";
import { loadSkillContent } from "./skills.js";
import { selectSkills } from "./selector.js";
import { BASE_SYSTEM_PROMPT } from "./prompts.js";
import { extractText, parseRouterResponse, retryWithBackoff } from "./utils.js";

async function runAgent(userPrompt, matchedSkills) {
    let systemPrompt = BASE_SYSTEM_PROMPT;

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

    const response = await retryWithBackoff(() =>
        client.messages.create({
            model: agentModel,
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: userPrompt,
                },
            ],
        })
    );

    return extractText(response);
}

export async function processPrompt(userPrompt, skills) {
    const selected = await selectSkills(userPrompt, skills);

    const selectedNames = parseRouterResponse(selected);

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
