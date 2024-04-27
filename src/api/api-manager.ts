import { injectable } from "tsyringe"
import { Config } from "../config"
import { Client, GatewayIntentBits, Message } from "discord.js"
import { ApiV1 } from "./api-v1"

const api = new ApiV1()

@injectable()
export class ApiManager {

    constructor(
        private config: Config,
    ) {}

    public async start(): Promise<void> {
        let discordClient = await this.createDiscordClient()
        await discordClient.login(this.config.botToken)
    }

    private async createDiscordClient(): Promise<Client> {
        return new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildVoiceStates,
            ]
        })
            .once("ready", () => {
                console.log("Ready")
            })
            .once("reconnecting", () => {
                console.log("Reconnecting")
            })
            .once("disconnect", () => {
                console.log("Disconnected")
            })
            .on("messageCreate", async message => {
                if(message.author.bot) return
                if(!message.content.startsWith(api.prefix)) return
                if(message.member == null) return
                if(message.guildId == null) return
                await this.routeCommand(message)
            })
    }

    private async routeCommand(message: Message): Promise<void> {
        const parts = message.content.trim().split(" ").filter(part => part != "")
        const command = parts[0].slice(api.prefix.length).toLowerCase()
        const args = parts.slice(1)
        const route = api.commandRoutes.find(route => route.command == command)
        if(route == null) return
        const handler = new route.handler
        if(message.guild == null)
            throw new Error("guild null")
        const guildId = message.guild.id
        try {
            await handler.handle(guildId, message, args)
        } catch(err) {
            console.error(`!${command} error: ${err}`)
            console.error(err.stack ?? err)
            const msg = err.sendMessage ? "Error: " + err.sendMessage : "Something bad happened ;;w;;"
            await message.channel.send(msg)
        }
    }
}
