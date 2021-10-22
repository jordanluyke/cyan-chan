import { Message } from "discord.js"

export class AudioQueueItem {

    constructor(
        public title: string,
        public url: string,
        public message: Message,
    ) {}
}
