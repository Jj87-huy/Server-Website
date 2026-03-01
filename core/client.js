const { Client, Collection, GatewayIntentBits } = require("discord.js");

module.exports = () => {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent
        ]
    });

    client.systems = new Collection();
    client.commands = {
        prefix: new Collection(),
        slash: new Collection()
    };

    return client;
};