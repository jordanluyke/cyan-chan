import { Message } from "discord.js"
import { InputFlag } from "./input-flag"

const youtubeUrlPrefix = "https://www.youtube.com/watch?v="

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
        await this.message.channel.send(msg)
    }
}
