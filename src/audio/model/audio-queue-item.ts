import { Message } from "discord.js"

export class AudioQueueItem {

    constructor(
        public title: string,
        public url: string,
        public videoId: string,
        public message: Message,
    ) {}
}
