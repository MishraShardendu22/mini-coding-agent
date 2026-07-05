import { selectSkills } from "./selector.js";
import { loadSkillContent } from "./skills.js";
import { BASE_SYSTEM_PROMPT } from "./prompts.js";
import { client, agentModel } from "./anthropic.js";
import retryWithBackoff, { extractText, parseRouterResponse } from "./utils.js";

// running the agent with the user prompt and matched skills
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

    // run the agent with the user prompt and the system prompt
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

// processPrompt takes a user prompt and a list of skills, selects the relevant skills, runs the agent with the selected skills, and prints the response.
export async function processPrompt(userPrompt, skills) {
    const selected = await selectSkills(userPrompt, skills);
    const selectedNames = parseRouterResponse(selected);
    const matchedSkills = skills.filter((skill) =>
        selectedNames.includes(skill.name.toLowerCase())
    );
    const response = await runAgent(userPrompt, matchedSkills);
    return { matchedSkills, response };
}
