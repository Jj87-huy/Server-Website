const config = require("./config");
const createClient = require("./core/client");
const loadSystems = require("./core/systemManager");
const loadCommands = require("./core/commandManager");
const registerSlash = require("./core/slashRegister");
const hotReload = require("./core/hotReload");

const { ensure } = require("./core/moduleManager");
const checkPermission = require("./core/permission");

const client = createClient();

/**
 * Reload toàn bộ (system + command)
 */
function reloadAll() {
    // unload systems
    client.systems.forEach(sys => {
        try {
            sys.onUnload?.(client);
        } catch (e) {
            console.error("[SYSTEM] Unload error", e);
        }
    });

    client.systems.clear();
    client.commands.prefix.clear();
    client.commands.slash.clear();

    loadSystems(client);
    loadCommands(client);
}

/**
 * Ready
 */
client.once("ready", async () => {
    await registerSlash(client);
    console.log(`Logged in as ${client.user.tag}`);
});

/**
 * Slash command handler
 */
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const cmd = client.commands.slash.get(interaction.commandName);
    if (!cmd) return;

    // load module config
    const cfg = ensure("commands", cmd.name);

    // disabled
    if (!cfg.enabled) {
        return interaction.reply({
            content: "⛔ Lệnh này đang bị tắt",
            ephemeral: true
        });
    }

    // system requirement (nếu command khai báo)
    if (cmd.system && !client.systems.has(cmd.system)) {
        return interaction.reply({
            content: "⛔ System của lệnh đang tắt",
            ephemeral: true
        });
    }

    // permission
    if (!checkPermission(interaction, cfg)) {
        return interaction.reply({
            content: "⛔ Bạn không có quyền dùng lệnh này",
            ephemeral: true
        });
    }

    try {
        await cmd.execute(interaction);
    } catch (err) {
        console.error(`[COMMAND] ${cmd.name}`, err);
        if (!interaction.replied) {
            interaction.reply({
                content: "❌ Lỗi khi chạy lệnh",
                ephemeral: true
            });
        }
    }
});

/**
 * Prefix command handler
 */
client.on("messageCreate", msg => {
    if (msg.author.bot) return;
    if (!msg.content.startsWith(config.bot.prefix)) return;

    const name = msg.content
        .slice(config.bot.prefix.length)
        .trim()
        .split(/\s+/)[0];

    const cmd = client.commands.prefix.get(name);
    if (!cmd) return;

    const cfg = ensure("commands", name);
    if (!cfg.enabled) return;

    try {
        cmd.execute(msg);
    } catch (err) {
        console.error(`[COMMAND] ${name}`, err);
    }
});

/**
 * Initial load
 */
reloadAll();

/**
 * Hot reload
 */
hotReload({
    reloadAll,
    reloadSystems: () => {
        client.systems.forEach(sys => {
            try {
                sys.onUnload?.(client);
            } catch {}
        });
        client.systems.clear();
        loadSystems(client);
    },
    reloadCommands: async () => {
        client.commands.prefix.clear();
        client.commands.slash.clear();
        loadCommands(client);
        await registerSlash(client);
    }
});

client.login(config.token);