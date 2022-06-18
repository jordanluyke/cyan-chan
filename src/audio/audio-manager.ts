import { injectable } from "tsyringe"
import { Config } from "../config"
import { AudioQueueItem } from "./model/audio-queue-item"
import { AudioPlayerStatus, createAudioResource, DiscordGatewayAdapterCreator, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice"
import ytdl from "ytdl-core"
import { Message, Permissions } from "discord.js"
import { youtube_v3 } from "googleapis"
import { HttpUtil } from "../util/http-util"
import { BotStateManager } from "../bot-state/bot-state-manager"
import { BotState } from "../bot-state/model/bot-state"
import { TimeUnit } from "../util/time-unit"
import { BotError } from "./model/error/bot-error"
import { createWriteStream } from "fs"

@injectable()
export class AudioManager {

    constructor(
        private config: Config,
        private botStateManager: BotStateManager,
    ) {}

    public async play(message: Message, args: string[]): Promise<void> {
        if(message.guild == null)
            throw new BotError("guild null", "Guild not found")
        let botState = this.getBotStateOrCreate(message.guild.id)
        let queueItems = await this.getQueueItemsFromMessage(message, args)
        if(queueItems.length == 0 && args.length > 0) {
            await message.channel.send("No search results")
            return Promise.resolve()
        }
        botState.audioQueueItems = botState.audioQueueItems.concat(queueItems)
        if(botState.audioPlayer.state.status == AudioPlayerStatus.Paused) {
            botState.audioPlayer.unpause()
        } else if(botState.audioPlayer.state.status != AudioPlayerStatus.Playing) {
            await this.playNextInQueue(message.guild.id)
        }
    }

    public async pause(guildId: string): Promise<void> {
        let botState = this.getBotStateOrCreate(guildId)
        botState.audioPlayer.pause()
    }

    public async skip(message: Message): Promise<void> {
        if(message.guild == null)
            throw new BotError("guild null", "Guild not found")
        let botState = this.getBotStateOrCreate(message.guild.id)
        if(botState.audioQueueItems.length > 1) {
            botState.audioQueueItems = botState.audioQueueItems.slice(1)
            botState.audioStream?.destroy()
            if(botState.audioQueueItems.length >= 1)
                await this.playNextInQueue(message.guild.id)
        } else {
            await message.channel.send("Queue empty")
            return
        }
    }

    public async stop(guildId: string): Promise<void> {
        let connection = getVoiceConnection(guildId)
        connection?.destroy()
    }

    public async getQueue(guildId: string): Promise<AudioQueueItem[]> {
        return this.getBotStateOrCreate(guildId).audioQueueItems
    }

    public async clearQueue(guildId: string): Promise<void> {
        let botState = this.getBotStateOrCreate(guildId)
        if(botState.audioQueueItems.length > 0) {
            if(botState.audioPlayer.state.status == AudioPlayerStatus.Paused || botState.audioPlayer.state.status == AudioPlayerStatus.Playing) {
                botState.audioQueueItems = botState.audioQueueItems.slice(0, 1)
            } else {
                botState.audioQueueItems = []
            }
        }
    }

    public async replaceQueueItem(message: Message, args: string[]): Promise<void> {
        if(message.guild == null)
            throw new BotError("guild null", "Guild not found")
        let botState = this.getBotStateOrCreate(message.guild.id)
        let queueItems = await this.getQueueItemsFromMessage(message, args)
        if(botState.audioQueueItems.length == 0) {
            await message.channel.send("No items in queue")
            return
        }
        if(queueItems.length == 0) {
            await message.channel.send("No item found in input")
            return
        }
        botState.audioQueueItems[0] = queueItems[0]
        await this.playNextInQueue(message.guild.id)
    }

    private async getQueueItemsFromMessage(message: Message, args: string[]): Promise<AudioQueueItem[]> {
        if(message.member == null)
            throw new BotError("member null", "Member not found")
        if(message.guild == null)
            throw new BotError("guild null", "Guild not found")
        let voiceChannel = message.member.voice.channel
        if(voiceChannel == null)
            throw new BotError("voice channel null", "Are you in a voice channel?")
        let user = message.client.user
        if(user == null)
            throw new BotError("user null", "User not found")
        let permissions = voiceChannel.permissionsFor(user)
        if(permissions == null || !permissions.has(Permissions.FLAGS.CONNECT) || !permissions.has(Permissions.FLAGS.SPEAK))
            throw new BotError("Invalid permissions", "I need connect and speak privileges :'(")
        if(args.length == 0)
            return []

        let youtube = new youtube_v3.Youtube({
            auth: this.config.youtubeApiKey
        })
        let queueItems: AudioQueueItem[] = []

        if(args[0].match(/^https:\/\/.*youtube.com\/.+$/)) {
            let splitUrl = args[0].split("?")
            if(splitUrl.length != 2)
                throw new BotError("Invalid url", "Invalid url")
            let qs = splitUrl[1]
            let params = HttpUtil.queryStringToMap(qs)
            let playlistId = params.get("list")
            if(playlistId != null) {
                let res = await youtube.playlistItems.list({
                    maxResults: 50,
                    part: ["snippet"],
                    playlistId: playlistId,
                })
                let items = res.data.items
                if(items == null)
                    throw new BotError("playlist items null", "No items found in playlist")
                queueItems = items.map(item => {
                    if(item.snippet == null)
                        throw new BotError("snippet null", "Snippet not found")
                    let title = item.snippet.title
                    if(title == null)
                        throw new BotError("title null", "Title not found")
                    if(item.snippet.resourceId == null)
                        throw new BotError("resourceId null", "resourceId not found")
                    let videoId = item.snippet.resourceId.videoId
                    if(videoId == null)
                        throw new BotError("videoId null", "videoId not found")
                    let url2 = "https://www.youtube.com/watch?v=" + videoId
                    if(voiceChannel == null)
                        throw new BotError("voiceChannel null", "Voice channel not found")
                    return new AudioQueueItem(title, url2, message)
                })
            }
        }

        if(queueItems.length == 0) {
            let searchTerms = args.join(" ")
            let res = await youtube.search.list({
                part: ["snippet"],
                q: searchTerms,
                regionCode: "US",
                safeSearch: "moderate",
            })
            let items = res.data.items
            if(items == null)
                throw new BotError("items null", "No search results found")
            if(items.length == 0)
                return []
            let item = items[0]
            let id = item.id
            if(id == null)
                throw new BotError("id null", "ID not found")
            let videoId = id.videoId
            if(videoId == null)
                throw new BotError("videoId null", "videoId not found")
            let url = "https://www.youtube.com/watch?v=" + videoId
            let snippet = item.snippet
            if(snippet == null)
                throw new BotError("snippet null", "snippet not found")
            let title = snippet.title
            if(title == null)
                throw new BotError("title null", "title not found")
            let queueItem = new AudioQueueItem(title, url, message)
            queueItems.push(queueItem)
        }

        return queueItems
    }

    private async playNextInQueue(guildId: string): Promise<void> {
        let botState = this.botStateManager.getStateOrThrow(guildId)
        if(botState.audioQueueItems.length == 0)
            throw new BotError("queue empty", "Queue empty")
        let item = botState.audioQueueItems[0]
        if(item.message.member == null)
            throw new BotError("member null", "Member not found")
        let voiceChannel = item.message.member.voice.channel
        if(voiceChannel == null)
            throw new BotError("voiceChannel null", "Are you in a voice channel?")
        let voiceConnection = getVoiceConnection(voiceChannel.guild.id)
        if(voiceConnection == null) {
            voiceConnection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: <DiscordGatewayAdapterCreator>voiceChannel.guild.voiceAdapterCreator,
            })
        }

        return new Promise((resolve, reject) => {
            console.log("Downloading:", item.title, item.url)
            let tempAudioFile = "target/audio.mp4"
            ytdl(item.url, {
                quality: "highestaudio",
                filter: "audioonly"
            })
            .pipe(createWriteStream(tempAudioFile))
            .on("error", err => {
                reject(err)
            })
            .on("finish", () => {
                botState.audioPlayer.play(createAudioResource(tempAudioFile))
                voiceConnection?.subscribe(botState.audioPlayer)
                resolve()
            })
        })
    }

    private getBotStateOrCreate(guildId: string): BotState {
        let botState = this.botStateManager.getState(guildId)
        if(botState == null) {
            botState = this.botStateManager.createState(guildId)
            this.subscribeOnStateCreate(guildId)
        }
        return botState
    }

    private subscribeOnStateCreate(guildId: string): void {
        let botState = this.botStateManager.getStateOrThrow(guildId)
        botState.audioPlayer
            .on("error", async error => {
                console.error("Player error:", error)
                if(botState.audioQueueItems.length == 0)
                    throw new Error("queue empty")
                let item = botState.audioQueueItems[0]
                await item.message.channel.send("Audio stream fail ;;w;;")
            })
            .on(AudioPlayerStatus.Buffering, async () => {
                // console.log("Buffering")
            })
            .on(AudioPlayerStatus.Playing, async () => {
                if(botState.idleTimeout != null)
                    clearTimeout(botState.idleTimeout)
                // console.log("Playing")
            })
            .on(AudioPlayerStatus.Paused, async () => {
                // console.log("Paused")
            })
            .on(AudioPlayerStatus.Idle, async () => {
                // console.log("Idle")
                botState.idleTimeout = setTimeout(() => {
                    let voiceConnection = getVoiceConnection(guildId)
                    voiceConnection?.destroy()
                }, TimeUnit.MINUTES.toMillis(30))

                botState.audioQueueItems = botState.audioQueueItems.slice(1)
                if(botState.audioQueueItems.length >= 1)
                    await this.playNextInQueue(guildId)
            })
            .on("unsubscribe", () => {
                console.log("unsubscribe")
            })
    }
}
