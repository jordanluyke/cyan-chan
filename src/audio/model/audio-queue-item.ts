import { Message, TextChannel } from 'discord.js'
import { InputFlag } from './input-flag.js'

const youtubeUrlPrefix = 'https://www.youtube.com/watch?v='

export class AudioQueueItem {
    constructor(
        public title: string,
        public videoId: string,
        public message: Message,
        public inputFlags: InputFlag[]
    ) {}

    public getYoutubeUrl(): string {
        return youtubeUrlPrefix + this.videoId
    }

    public async sendMessage(msg: string): Promise<void> {
        const channel = this.message.channel as TextChannel
        await channel.send(msg)
    }
}
