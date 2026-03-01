const fs = require("fs");
const path = require("path");
const { ensure } = require("./moduleManager");

/**
 * Load commands theo type (prefix | slash)
 */
function loadType(client, type) {
    const baseDir = path.join(__dirname, "..", "commands", type);
    if (!fs.existsSync(baseDir)) return;

    for (const group of fs.readdirSync(baseDir)) {
        const groupDir = path.join(baseDir, group);
        if (!fs.statSync(groupDir).isDirectory()) continue;

        for (const file of fs.readdirSync(groupDir)) {
            if (!file.endsWith(".js")) continue;

            const filePath = path.join(groupDir, file);

            try {
                // clear cache (hot reload)
                delete require.cache[require.resolve(filePath)];

                const cmd = require(filePath);

                // validate command
                if (
                    !cmd ||
                    typeof cmd.name !== "string" ||
                    typeof cmd.execute !== "function"
                ) {
                    console.warn(
                        `[COMMAND] Skip invalid command: ${filePath}`
                    );
                    continue;
                }

                // ensure module config (chỉ enabled + permission)
                const cfg = ensure("commands", cmd.name, {
                    type,
                    group
                });

                // disabled → không load
                if (!cfg.enabled) continue;

                // attach metadata (runtime only)
                cmd.type = type;          // prefix | slash
                cmd.group = group;        // moderation / fun / admin / ...
                cmd.__file = filePath;    // dùng cho reload theo tên

                // register
                client.commands[type].set(cmd.name, cmd);

                console.log(
                    `[COMMAND] Loaded ${type}:${group}/${cmd.name}`
                );

            } catch (err) {
                console.error(
                    `[COMMAND] Failed to load ${filePath}`,
                    err
                );
            }
        }
    }
}

/**
 * Load all commands
 */
module.exports = function loadCommands(client) {
    loadType(client, "prefix");
    loadType(client, "slash");
};