import fs from "node:fs";
import path from "node:path";
import { stripFrontMatter } from "./utils.js";

const SKILLS_DIR = ".skills";

export function loadSkillMetadata(skillFilePath) {
    const content = fs.readFileSync(skillFilePath, "utf8");

    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

    if (!match) {
        throw new Error(`Invalid SKILL.md (no front matter): ${skillFilePath}`);
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

        try {
            skills.push(loadSkillMetadata(skillFile));
        } catch (err) {
            console.warn(`Warning: Skipping skill — ${err.message}`);
        }
    }

    return skills;
}

export function loadSkillContent(skill) {
    const sections = [];

    const raw = fs.readFileSync(skill.path, "utf8");
    sections.push(stripFrontMatter(raw));

    const docsDir = path.join(path.dirname(skill.path), "docs");

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

    return sections.join("\n\n");
}
