import { Message } from "discord.js"

export interface MessageRouteHandler {
    handle(guildId: string, message: Message, args: string[]): Promise<void>
}
