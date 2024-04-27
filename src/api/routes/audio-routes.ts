import { Message } from "discord.js"
import { autoInjectable } from "tsyringe"
import { MessageRouteHandler } from "../model/message-route-handler"
import { AudioManager } from "../../audio/audio-manager"

@autoInjectable()
export class PlayAudio implements MessageRouteHandler {
    constructor(
        public audioManager?: AudioManager,
    ) {}

    public async handle(guildId: string, message: Message, args: string[]) : Promise<void> {
        if(this.audioManager == null) throw new Error("Injection failed")
        return this.audioManager.play(guildId, message, args)
    }
}

@autoInjectable()
export class PauseAudio implements MessageRouteHandler {
    constructor(
        public audioManager?: AudioManager,
    ) {}

    public async handle(guildId: string, message: Message, args: string[]) : Promise<void> {
        if(this.audioManager == null) throw new Error("Injection failed")
        return this.audioManager.pause(guildId)
    }
}

@autoInjectable()
export class StopAudio implements MessageRouteHandler {
    constructor(
        public audioManager?: AudioManager,
    ) {}

    public async handle(guildId: string, message: Message, args: string[]) : Promise<void> {
        if(this.audioManager == null) throw new Error("Injection failed")
        return this.audioManager.stop(guildId)
    }
}

@autoInjectable()
export class SkipAudio implements MessageRouteHandler {
    constructor(
        public audioManager?: AudioManager,
    ) {}

    public async handle(guildId: string, message: Message, args: string[]) : Promise<void> {
        if(this.audioManager == null) throw new Error("Injection failed")
        this.audioManager.skip(guildId, message)
    }
}

@autoInjectable()
export class GetAudioQueue implements MessageRouteHandler {
    constructor(
        public audioManager?: AudioManager,
    ) {}

    public async handle(guildId: string, message: Message, args: string[]) : Promise<void> {
        if(this.audioManager == null) throw new Error("Injection failed")
        const queue = await this.audioManager.getQueue(guildId)
        let response = ""
        if(queue.length > 0) {
            for(let i = 0; i < queue.length; i++) {
                const item = queue[i]
                response += `${i == 0 ? "Now playing" : i+1}: ${item.title}\n\n`
            }
        } else {
            response = "Queue empty"
        }
        await message.channel.send(response)
    }
}

@autoInjectable()
export class ClearAudioQueue implements MessageRouteHandler {
    constructor(
        public audioManager?: AudioManager,
    ) {}

    public async handle(guildId: string, message: Message, args: string[]) : Promise<void> {
        if(this.audioManager == null) throw new Error("Injection failed")
        return this.audioManager.clearQueue(guildId)
    }
}

@autoInjectable()
export class GetAudioSource implements MessageRouteHandler {
    constructor(
        public audioManager?: AudioManager,
    ) {}

    public async handle(guildId: string, message: Message, args: string[]) : Promise<void> {
        if(this.audioManager == null) throw new Error("Injection failed")
        const queue = await this.audioManager.getQueue(guildId)
        let response = ""
        if(queue.length > 0) {
            response = queue[0].getYoutubeUrl()
        } else {
            response = "Queue empty"
        }
        await message.channel.send(response)
    }
}

@autoInjectable()
export class ReplaceAudioQueueItem implements MessageRouteHandler {
    constructor(
        public audioManager?: AudioManager,
    ) {}

    public async handle(guildId: string, message: Message, args: string[]) : Promise<void> {
        if(this.audioManager == null) throw new Error("Injection failed")
        return this.audioManager.replaceQueueItem(guildId, message, args)
    }
}

@autoInjectable()
export class DownloadMessages implements MessageRouteHandler {
    constructor(
    ) {}

    public async handle(guildId: string, message: Message, args: string[]) : Promise<void> {
    }
}
