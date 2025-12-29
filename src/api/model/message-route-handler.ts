import { Message } from 'discord.js'

export interface MessageRouteHandler {
    handle(message: Message, args: string[]): Promise<void>
}
