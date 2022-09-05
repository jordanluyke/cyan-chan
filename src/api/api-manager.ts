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
                GatewayIntentBits.GuildVoiceStates
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
            console.error(err.stack ?? err)
            let msg = err.sendMessage ? "Error: " + err.sendMessage : "Something bad happened ;;w;;"
            await message.channel.send(msg)
        }
    }
}
