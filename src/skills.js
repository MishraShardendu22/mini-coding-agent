import fs from "node:fs";
import path from "node:path";
import { stripFrontMatter } from "./utils.js";

const SKILLS_DIR = ".skills";

// cache skill content to avoid reading the same file multiple times
const skillContentCache = new Map();

// captures everything between the first opening --- and the next closing --- at the start of the file.
export function loadSkillMetadata(skillFilePath) {
    const content = fs.readFileSync(skillFilePath, "utf8");
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

    if (!match) {
        throw new Error(`Invalid SKILL.md (no front matter): ${skillFilePath}`);
    }

    const metadata = {};

    // line wise match and create a key value pair in the metadata object
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

    if (!metadata.name || !metadata.description) {
        throw new Error(
            `Invalid SKILL.md (missing name or description): ${skillFilePath}`
        );
    }

    return {
        name: metadata.name,
        description: metadata.description,
        path: skillFilePath,
    };
}

export function discoverSkills() {
    // returns true if the skills directory exists, false otherwise
    if (!fs.existsSync(SKILLS_DIR)) {
        throw new Error(`Directory '${SKILLS_DIR}' not found.`);
    }

    const skills = [];

    // reads all the files in the skills directory
    const entries = fs.readdirSync(SKILLS_DIR, {
        withFileTypes: true,
    });

    // 
    for (const entry of entries) {
        // skip if the entry is not a directory
        if (!entry.isDirectory()) continue;

        // path of skill.md for each
        const skillFile = path.join(SKILLS_DIR, entry.name, "SKILL.md");

        // Returns true if the path exists, false otherwise.
        if (!fs.existsSync(skillFile)) continue;

        // loads the skill metadata and pushes it to the skills array
        try {
            skills.push(loadSkillMetadata(skillFile));
        } catch (err) {
            console.warn(`Warning: Skipping skill — ${err.message}`);
        }
    }

    // return the skills array
    return skills;
}

export function loadSkillContent(skill) {
    // check skill content cache for the skill path, if it exists return the cached content
    if (skillContentCache.has(skill.path)) {
        return skillContentCache.get(skill.path);
    }

    // content is not in the cache, read the skill file and any docs in the docs directory
    const sections = [];
    const raw = fs.readFileSync(skill.path, "utf8");
    sections.push(stripFrontMatter(raw));

    // read documentation files in the docs directory
    const docsDir = path.join(path.dirname(skill.path), "docs");

    // check if the docs directory exists, 
    // if it does read all the markdown files in it and append their content to the sections array 
    if (fs.existsSync(docsDir)) {
        const docs = fs
            .readdirSync(docsDir)
            .filter((file) => file.endsWith(".md"))
            .sort((a, b) => a.localeCompare(b));

        for (const doc of docs) {
            const docPath = path.join(docsDir, doc);

            sections.push(
                `
========================================
DOCUMENT: ${doc}
========================================

${fs.readFileSync(docPath, "utf8")}
`
            );
        }
    }

    const content = sections.join("\n\n");

    // cache the content for future use
    skillContentCache.set(skill.path, content);
    return content;
}
