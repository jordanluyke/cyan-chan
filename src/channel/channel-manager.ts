import { injectable } from 'tsyringe'
import { Message, TextChannel } from 'discord.js'

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
                .then((msgs) => {
                    return msgs.map((msg: any) => {
                        return {
                            id: msg.id,
                            timestamp: msg.createdTimestamp,
                            author: {
                                id: msg.author.id,
                                username: msg.author.username,
                                globalName: msg.author.globalName,
                                avatar: msg.author.avatar,
                                bot: msg.author.bot,
                                system: msg.author.system,
                            },
                            content: msg.content,
                        }
                    })
                })
            if (msgs.length == 0) break
            messages = messages.concat(msgs)
            if (msgs.length != limit) break
        }

        messages = messages.filter((msg: any) => msg.content != '').reverse()

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
