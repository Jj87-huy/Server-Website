const fs = require("fs");
const path = require("path");

const BASE_DIR = path.join(__dirname, "..", "config", "modules");
const DEP_FILE = path.join(BASE_DIR, "dependencies.json");

const DEFAULT_BASE = {
    enabled: true,
    permission: { user: [], role: [] }
};

/**
 * Deep ensure: chỉ thêm key thiếu, KHÔNG ghi đè
 */
function deepEnsure(target, source) {
    let changed = false;

    for (const key of Object.keys(source)) {
        if (target[key] === undefined) {
            target[key] = source[key];
            changed = true;
            continue;
        }

        if (
            typeof target[key] === "object" &&
            target[key] !== null &&
            !Array.isArray(target[key]) &&
            typeof source[key] === "object" &&
            source[key] !== null &&
            !Array.isArray(source[key])
        ) {
            if (deepEnsure(target[key], source[key]))
                changed = true;
        }
    }

    return changed;
}

function ensureDir(dir) {
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
}

function getFile(type, name) {
    return path.join(BASE_DIR, type, `${name}.json`);
}

function readFile(type, name) {
    const file = getFile(type, name);
    if (!fs.existsSync(file)) return null;

    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return null;
    }
}

function writeFile(type, name, data) {
    ensureDir(path.join(BASE_DIR, type));
    fs.writeFileSync(
        getFile(type, name),
        JSON.stringify(data, null, 2)
    );
}

/**
 * Ensure module config (system / command)
 */
function ensure(type, name, schema = {}) {
    ensureDir(path.join(BASE_DIR, type));

    let data = readFile(type, name) || {};
    let changed = false;

    if (deepEnsure(data, DEFAULT_BASE)) changed = true;
    if (deepEnsure(data, schema)) changed = true;

    if (changed) writeFile(type, name, data);

    return data;
}

/**
 * Read all module configs of a type
 */
function readAll(type) {
    const dir = path.join(BASE_DIR, type);
    if (!fs.existsSync(dir)) return {};

    const result = {};
    for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith(".json")) continue;
        const name = file.replace(".json", "");
        try {
            result[name] = JSON.parse(
                fs.readFileSync(path.join(dir, file), "utf8")
            );
        } catch {}
    }

    return result;
}

/**
 * Read dependencies.json
 */
function readDependencies() {
    if (!fs.existsSync(DEP_FILE)) {
        const base = { system: [], command: [] };
        fs.writeFileSync(DEP_FILE, JSON.stringify(base, null, 2));
        return base;
    }

    try {
        return JSON.parse(fs.readFileSync(DEP_FILE, "utf8"));
    } catch {
        return { system: [], command: [] };
    }
}

module.exports = {
    ensure,
    readAll,
    readDependencies
};