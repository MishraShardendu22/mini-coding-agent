export function stripFrontMatter(content) {
    return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
}

/*
Example API response:

{
    content: [
        {
            type: "text",
            text: "Hello "
        },
        {
            type: "text",
            text: "World"
        }
    ]
}

The function returns: Hello World
// converts an API response into a plain string
*/ 
export function extractText(response) {
    if (!response) {
        throw new Error("No response returned from API.");
    }

    if (!Array.isArray(response.content)) {
        const details = JSON.stringify(response, null, 2);
        throw new Error(
            `Invalid Anthropic/OpenRouter response.\nResponse:\n${details}`
        );
    }

    return response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("")
        .trim();
}

/*
This function converts the LLM output into an array of skill names.

Example input:

{"skills":["git","docker","linux"]}

Output:

[
    "git",
    "docker",
    "linux"
]
*/ 
// parseRouterResponse takes a string response from the 
// router and returns an array of skill names.
export function parseRouterResponse(text) {
    const trimmed = text.trim();

    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed.skills)) {
            return [...new Set(
                parsed.skills
                    .map(s => String(s).trim().toLowerCase())
                    .filter(Boolean)
            )];
        }
    } catch (_) {}

    const jsonMatch = trimmed.match(/\{[\s\S]*"skills"[\s\S]*\}/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed.skills)) {
                return [...new Set(
                    parsed.skills
                        .map(s => String(s).trim().toLowerCase())
                        .filter(Boolean)
                )];
            }
        } catch (_) {}
    }

    if (trimmed.toUpperCase() === "NONE") return [];

    return [...new Set(
        trimmed
            .split(",")
            .map(s =>
                s
                    .trim()
                    .toLowerCase()
                    .replace(/[."'`]/g, "")
            )
            .filter(Boolean)
    )];
}

// retry wuth exponential backoff for transient errors (429, 500, 502, 503)
// 2 4 8 16 32 64
export default async function retryWithBackoff(fn, maxRetries = 4){
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            const status = err?.status;
            const isTransient =
                status === 429 ||
                status === 500 ||
                status === 502 ||
                status === 503;

            if (!isTransient || attempt === maxRetries) {
                throw err;
            }

            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
