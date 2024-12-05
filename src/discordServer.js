import "dotenv/config";
import { Client, GatewayIntentBits, Events } from 'discord.js';

export class discordServer {
    constructor() { 
        this.client = new Client(
            {
                intents: [
                    GatewayIntentBits.Guilds,
                    GatewayIntentBits.GuildMessages,
                    GatewayIntentBits.MessageContent,
                    GatewayIntentBits.GuildMembers,
                ],
            }
        );
    }

    //这里是gateway消息
    onWSMessageCreate(message) {}

    //这里是命令行消息
    conMessageCreate(message) {}

    connect() {
        this.bindEvent();
        this.client.login(process.env.DISCORD_TOKEN);
    }
    
    bindEvent() {
        this.client.on('ready', () => {
            console.log(`Logged in as ${this.client.user.tag}!`);
        });
    
        this.client.on(Events.MessageCreate, message => {
            if (message.author.bot) return;
            this.onWSMessageCreate(message);
        });
    
        //'interactionCreate'
        this.client.on(Events.InteractionCreate, async interaction => {
            //console.log(interaction);
            if (!interaction.isChatInputCommand()) return;
            this.onMessageCreate(interaction);
        });
    }

    registerCommand() {
        //TODO
    }
}