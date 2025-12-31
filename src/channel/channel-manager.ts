import { injectable } from 'tsyringe'
import { Message, TextChannel, Collection } from 'discord.js'

@injectable()
export class ChannelManager {
    public async downloadMessages(message: Message): Promise<void> {
        const guildId = message.guildId
        const channelId = message.channelId
        const guild = message.guild
        if (guild == null) {
            throw new Error('guild null')
        }
        const channel = guild.channels.cache.find(
            (channel) => channel.id == channelId
        ) as TextChannel

        await channel.send('Preparing...')

        let messages: any[] = []
        while (true) {
            const limit = 100
            const msgs = await message.channel.messages
                .fetch({
                    limit,
                    before: messages.length > 0 ? messages[messages.length - 1].id : null,
                })
                .then((msgMap) =>
                    Array.from(msgMap.values()).map((msg) => {
                        const json = msg.toJSON()
                        for (const [key, value] of Object.entries(msg)) {
                            if (value instanceof Collection) {
                                json[key] = Object.fromEntries(value.entries())
                            } else if (value && typeof value.toJSON === 'function') {
                                json[key] = value.toJSON()
                            }
                        }
                        return json
                    })
                )

            if (msgs.length == 0) break
            messages = messages.concat(msgs)
            if (msgs.length != limit) break
        }

        messages = messages.reverse()

        const data = {
            guildName: guild?.name,
            channelName: channel?.name,
            guildId,
            channelId,
            timestamp: new Date().getTime(),
            messages,
        }
        await channel.send({
            files: [
                {
                    name: 'messages.json',
                    contentType: 'application/json',
                    attachment: Buffer.from(JSON.stringify(data, null, 2)),
                },
            ],
        })
    }
}
