const fs = require("fs");
const path = require("path");
const { ensure } = require("./moduleManager");

const DEP_FILE = path.join(
    __dirname,
    "..",
    "config",
    "modules",
    "dependencie.json"
);

function readSystemOrder() {
    if (!fs.existsSync(DEP_FILE)) return [];
    try {
        const data = JSON.parse(fs.readFileSync(DEP_FILE, "utf8"));
        return Array.isArray(data?.dependencies?.system)
            ? data.dependencies.system
            : [];
    } catch {
        return [];
    }
}

module.exports = function loadSystems(client) {
    const baseDir = path.join(__dirname, "..", "systems");
    if (!fs.existsSync(baseDir)) return;

    const systemFiles = new Map();

    // Scan systems
    for (const name of fs.readdirSync(baseDir)) {
        const entry = path.join(baseDir, name, "index.js");
        if (fs.existsSync(entry)) {
            systemFiles.set(name, entry);
        }
    }

    const order = readSystemOrder();

    // 👉 Sắp xếp: system có trong dependencie.json load trước
    const sortedNames = [
        ...order.filter(n => systemFiles.has(n)),
        ...[...systemFiles.keys()].filter(n => !order.includes(n))
    ];

    for (const name of sortedNames) {
        const cfg = ensure("systems", name);

        if (!cfg.enabled) {
            console.log(`[SYSTEM] ${name} disabled`);
            continue;
        }

        const entry = systemFiles.get(name);

        try {
            delete require.cache[require.resolve(entry)];
            const system = require(entry);

            system.onLoad?.(client);
            client.systems.set(name, system);

            console.log(`[SYSTEM] Loaded ${name}`);
        } catch (err) {
            console.error(`[SYSTEM] Failed to load ${name}`, err);
        }
    }
};