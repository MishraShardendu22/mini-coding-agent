import "./src/anthropic.js";
import { discoverSkills } from "./src/skills.js";
import { startCli } from "./src/cli.js";

try {
    const skills = discoverSkills();
    startCli(skills);
} catch (err) {
    console.error(err);
    process.exit(1);
}