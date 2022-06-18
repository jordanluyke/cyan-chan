import { injectable } from "tsyringe"
import { Config } from "../config"
import { Client, Intents, Message } from "discord.js"
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
            intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]
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
        let parts = message.content.trim().split(" ").filter(part => part != "")
        let command = parts[0].slice(api.prefix.length).toLowerCase()
        let args = parts.slice(1)
        let route = api.commandRoutes.find(route => route.command == command)
        if(route == null) return
        let handler = new route.handler
        try {
            await handler.handle(message, args)
        } catch(err) {
            console.error(`!${command} error: ${err}`)
            let msg = err.sendMessage ? "Error: " + err.sendMessage : "I made a fucky wucky, I'm sowwy onyii-chan ;;w;;"
            await message.channel.send(msg)
        }
    }
}
