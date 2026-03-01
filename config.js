const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * Load json recursive, giữ nguyên cấu trúc thư mục
 */
function loadConfigs(dir) {
    const result = {};

    if (!fs.existsSync(dir)) return result;

    for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        const stat = fs.statSync(full);

        // Folder → đệ quy
        if (stat.isDirectory()) {
            result[item] = loadConfigs(full);
            continue;
        }

        // JSON file
        if (item.endsWith(".json")) {
            const key = item.replace(".json", "");
            try {
                result[key] = JSON.parse(fs.readFileSync(full, "utf8"));
            } catch (e) {
                console.error(`[CONFIG] Failed to load ${full}`, e.message);
            }
        }
    }

    return result;
}

module.exports = {
    token: process.env.TOKEN,
    ...loadConfigs(path.join(__dirname, "config"))
};