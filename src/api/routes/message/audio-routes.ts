import { Message } from "discord.js"
import { autoInjectable } from "tsyringe"
import { MessageRouteHandler } from "../../model/message-route-handler"
import { AudioManager } from "../../../audio/audio-manager"

@autoInjectable()
export class PlayAudio implements MessageRouteHandler {
    constructor(
        public audioManager?: AudioManager,
    ) {}

    public async handle(message: Message, args: string[]) : Promise<void> {
        if(this.audioManager == null)
            throw new Error("Injection failed")
        await this.audioManager.play(message, args)
    }
}

@autoInjectable()
export class PauseAudio implements MessageRouteHandler {
    constructor(
        public audioManager?: AudioManager,
    ) {}

    public async handle(message: Message, args: string[]) : Promise<void> {
        if(this.audioManager == null)
            throw new Error("Injection failed")
        if(message.guild == null)
            throw new Error("guild null")
        await this.audioManager.pause(message.guild.id)
    }
}

@autoInjectable()
export class StopAudio implements MessageRouteHandler {
    constructor(
        public audioManager?: AudioManager,
    ) {}

    public async handle(message: Message, args: string[]) : Promise<void> {
        if(this.audioManager == null)
            throw new Error("Injection failed")
        if(message.guild == null)
            throw new Error("guild null")
        await this.audioManager.stop(message.guild.id)
    }
}

@autoInjectable()
export class SkipAudio implements MessageRouteHandler {
    constructor(
        public audioManager?: AudioManager,
    ) {}

    public async handle(message: Message, args: string[]) : Promise<void> {
        if(this.audioManager == null)
            throw new Error("Injection failed")
        if(message.guild == null)
            throw new Error("guild null")
        this.audioManager.skip(message.guild.id)
    }
}

@autoInjectable()
export class GetAudioQueue implements MessageRouteHandler {
    constructor(
        public audioManager?: AudioManager,
    ) {}

    public async handle(message: Message, args: string[]) : Promise<void> {
        if(this.audioManager == null)
            throw new Error("Injection failed")
        if(message.guild == null)
            throw new Error("guild null")
        let queue = await this.audioManager.getQueue(message.guild.id)
        let response = ""
        if(queue.length > 0) {
            for(let i = 0; i < queue.length; i++) {
                let item = queue[i]
                response += `${i == 0 ? "Now playing" : i+1}: ${item.title}\n\n`
            }
        } else {
            response = "Queue is empty"
        }
        await message.channel.send(response)
    }
}

@autoInjectable()
export class ClearAudioQueue implements MessageRouteHandler {
    constructor(
        public audioManager?: AudioManager,
    ) {}

    public async handle(message: Message, args: string[]) : Promise<void> {
        if(this.audioManager == null)
            throw new Error("Injection failed")
        if(message.guild == null)
            throw new Error("guild null")
        await this.audioManager.clearQueue(message.guild.id)
    }
}

@autoInjectable()
export class GetAudioSource implements MessageRouteHandler {
    constructor(
        public audioManager?: AudioManager,
    ) {}

    public async handle(message: Message, args: string[]) : Promise<void> {
        if(this.audioManager == null)
            throw new Error("Injection failed")
        if(message.guild == null)
            throw new Error("guild null")
        let queue = await this.audioManager.getQueue(message.guild.id)
        let response = ""
        if(queue.length > 0) {
            response = queue[0].url
        } else {
            response = "Queue is empty"
        }
        await message.channel.send(response)
    }
}

@autoInjectable()
export class ReplaceAudioQueueItem implements MessageRouteHandler {
    constructor(
        public audioManager?: AudioManager,
    ) {}

    public async handle(message: Message, args: string[]) : Promise<void> {
        if(this.audioManager == null)
            throw new Error("Injection failed")
        if(message.guild == null)
            throw new Error("guild null")
        this.audioManager.replaceQueueItem(message, args)
    }
}
