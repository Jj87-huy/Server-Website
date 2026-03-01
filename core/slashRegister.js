const { REST, Routes } = require("discord.js");
const config = require("../config");
const { ensure } = require("./moduleManager");

module.exports = async function registerSlash(client) {
    if (!client.user) return;

    const rest = new REST({ version: "10" }).setToken(config.token);

    // build slash payload
    const body = [];

    for (const cmd of client.commands.slash.values()) {
        if (!cmd?.data?.toJSON) continue;

        const cfg = ensure("commands", cmd.name);

        if (!cfg.enabled) continue;

        body.push(cmd.data.toJSON());
    }

    if (body.length === 0) {
        console.log("[SLASH] No enabled slash commands → clearing");
    }

    const guilds = Array.isArray(config.bot.guildID)
        ? config.bot.guildID
        : [];

    for (const guildId of guilds) {
        try {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, guildId),
                { body }
            );

            console.log(
                `[SLASH] Synced ${body.length} command(s) → guild ${guildId}`
            );
        } catch (err) {
            console.error(
                `[SLASH] Failed to sync guild ${guildId}`,
                err
            );
        }
    }
};