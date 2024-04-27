import { Message } from "discord.js"
import { autoInjectable } from "tsyringe"
import { MessageRouteHandler } from "../model/message-route-handler"
import { ChannelManager } from "../../channel/channel-manager"

@autoInjectable()
export class DownloadMessages implements MessageRouteHandler {
    constructor(
        public channelManager?: ChannelManager,
    ) {}

    public async handle(guildId: string, message: Message, args: string[]) : Promise<void> {
        if(this.channelManager == null) throw new Error("Injection failed")
        return this.channelManager.downloadMessages(guildId, message)
    }
}
