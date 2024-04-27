import { injectable } from "tsyringe"
import { Config } from "../config"
import { Message } from "discord.js"

@injectable()
export class ChannelManager {

    constructor(
        private config: Config,
    ) {}

    public async downloadMessages(guildId: string, message: Message): Promise<void> {
        const channelId = message.channelId
        const guild = message.guild
        const channel = message.guild?.channels.cache.find(channel => channel.id == channelId)

        await message.channel.send("Fetching all messages...")

        let messages: any[] = []
        while (true) {
            const msgs = await message.channel.messages.fetch({
                limit: 100,
                before: messages.length > 0 ? messages[messages.length - 1].id : null
            })
                .then(msgs => {
                    return msgs.map((msg: any) => {
                        return {
                            id: msg.id,
                            timestamp: msg.createdTimestamp,
                            author: msg.author.global_name ?? msg.author.username,
                            content: msg.content,
                        }
                    })
                })
            if (msgs.length == 0) break
            messages = messages.concat(msgs)
        }

        messages = messages.filter((msg: any) => msg.content != "")

        const data = {
            guildName: guild?.name,
            channelName: channel?.name,
            guildId,
            channelId,
            timestamp: new Date().getTime(),
            messages: messages.reverse(),
        }

        await message.channel.send("Done")
        await message.channel.send({
            files: [{
                name: "messages.json",
                contentType: "application/json",
                attachment: Buffer.from(JSON.stringify(data, null, 2))
            }]
        })
    }
}
