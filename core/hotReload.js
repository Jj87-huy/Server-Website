const chokidar = require("chokidar");
const path = require("path");

module.exports = function hotReload({
    reloadAll,
    reloadSystems,
    reloadCommands
}) {
    const SYSTEM_DIR = path.join(__dirname, "..", "systems");
    const COMMAND_DIR = path.join(__dirname, "..", "commands");

    let systemTimer = null;
    let commandTimer = null;

    function debounce(type, fn, delay = 300) {
        if (type === "system") {
            clearTimeout(systemTimer);
            systemTimer = setTimeout(fn, delay);
        } else if (type === "command") {
            clearTimeout(commandTimer);
            commandTimer = setTimeout(fn, delay);
        }
    }

    function detectType(file) {
        if (!file.endsWith(".js")) return null;

        if (file.startsWith(SYSTEM_DIR))
            return "system";

        if (file.startsWith(COMMAND_DIR))
            return "command";

        return null;
    }

    chokidar
        .watch([SYSTEM_DIR, COMMAND_DIR], {
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 200,
                pollInterval: 50
            }
        })
        .on("add", file => {
            const type = detectType(file);
            if (!type) return;

            console.log(`[HOT] File added: ${path.basename(file)}`);

            debounce(type, () => {
                console.log(`[HOT] Reload ${type}s`);
                if (type === "system") reloadSystems?.();
                else reloadCommands?.();
            });
        })
        .on("change", file => {
            const type = detectType(file);
            if (!type) return;

            console.log(`[HOT] File changed: ${path.basename(file)}`);

            debounce(type, () => {
                console.log(`[HOT] Reload ${type}s`);
                if (type === "system") reloadSystems?.();
                else reloadCommands?.();
            });
        })
        .on("unlink", file => {
            const type = detectType(file);
            if (!type) return;

            console.log(`[HOT] File removed: ${path.basename(file)}`);

            debounce(type, () => {
                console.log(`[HOT] Reload ${type}s`);
                if (type === "system") reloadSystems?.();
                else reloadCommands?.();
            });
        });
};