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

@injectable()
export class AudioManager {

    constructor(
        private config: Config,
        private botStateManager: BotStateManager,
    ) {}

    public async play(message: Message, args: string[]): Promise<void> {
        if(message.guild == null)
            throw new Error("guild null")
        await this.addQueueItems(message, args)
        let botState = this.getBotStateOrCreate(message.guild.id)
        if(botState.audioPlayer.state.status == AudioPlayerStatus.Paused) {
            botState.audioPlayer.unpause()
        } else if(botState.audioPlayer.state.status != AudioPlayerStatus.Playing) {
            await this.playQueue(message.guild.id)
        }
    }

    public async pause(guildId: string): Promise<void> {
        let botState = this.getBotStateOrCreate(guildId)
        botState.audioPlayer.pause()
    }

    public async skip(guildId: string): Promise<void> {
        let botState = this.getBotStateOrCreate(guildId)
        if(botState.audioQueueItems.length > 1) {
            botState.audioQueueItems = botState.audioQueueItems.slice(1)
            botState.audioStream?.destroy()
            await this.playQueue(guildId)
        } else if(botState.audioQueueItems.length == 1) {
            botState.audioQueueItems = botState.audioQueueItems.slice(1)
            botState.audioStream?.destroy()
            let voiceConnection = getVoiceConnection(guildId)
            voiceConnection?.destroy()
        } else {
            throw new Error("skip but queue null")
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

    private async addQueueItems(message: Message, args: string[]): Promise<void> {
        if(message.member == null)
            throw new Error("member null")
        if(message.guild == null)
            throw new Error("guild null")
        let voiceChannel = message.member.voice.channel
        if(voiceChannel == null)
            throw new Error("voice channel null")
        let user = message.client.user
        if(user == null)
            throw new Error("user null")
        let permissions = voiceChannel.permissionsFor(user)
        if(permissions == null || !permissions.has(Permissions.FLAGS.CONNECT) || !permissions.has(Permissions.FLAGS.SPEAK))
            throw new Error("Invalid permissions")
        if(args.length == 0) return

        let youtube = new youtube_v3.Youtube({
            auth: this.config.youtubeApiKey
        })
        let queueItems: AudioQueueItem[] = []

        if(args[0].match(/^https:\/\/.*youtube.com\/.+$/)) {
            let splitUrl = args[0].split("?")
            if(splitUrl.length != 2)
                throw new Error("Invalid url")
            let qs = splitUrl[1]
            let params = HttpUtil.queryStringToMap(qs)
            let playlistId = params.get("list")
            if(playlistId != null) {
                let res = await youtube.playlistItems.list({
                    part: ["snippet"],
                    playlistId: playlistId
                })
                let items = res.data.items
                if(items == null)
                    throw new Error("No items found in playlist")
                queueItems = items.map(item => {
                    if(item.snippet == null)
                        throw new Error("snippet null")
                    let title = item.snippet.title
                    if(title == null)
                        throw new Error("title null")
                    if(item.snippet.resourceId == null)
                        throw new Error("resourceId null")
                    let videoId = item.snippet.resourceId.videoId
                    if(videoId == null)
                        throw new Error("videoId null")
                    let url2 = "https://www.youtube.com/watch?v=" + videoId
                    if(voiceChannel == null)
                        throw new Error("voiceChannel null")
                    return new AudioQueueItem(title, url2, message)
                })
            }
        }

        if(queueItems.length == 0) {
            let searchTerms = args.join(" ")
            let res = await youtube.search.list({
                part: ["snippet"],
                q: searchTerms
            })
            let items = res.data.items
            if(items == null)
                throw new Error("items null")
            let item = items[0]
            let id = item.id
            if(id == null)
                throw new Error("id null")
            let videoId = id.videoId
            if(videoId == null)
                throw new Error("videoId null")
            let url = "https://www.youtube.com/watch?v=" + videoId
            let snippet = item.snippet
            if(snippet == null)
                throw new Error("snippet null")
            let title = snippet.title
            if(title == null)
                throw new Error("title null")
            let queueItem = new AudioQueueItem(title, url, message)
            queueItems.push(queueItem)
        }

        if(queueItems.length > 0) {
            let botState = this.getBotStateOrCreate(message.guild.id)
            botState.audioQueueItems = botState.audioQueueItems.concat(queueItems)
        }
    }

    private async playQueue(guildId: string): Promise<void> {
        let botState = this.botStateManager.getStateOrThrow(guildId)
        if(botState.audioQueueItems.length == 0)
            throw new Error("queue empty")
        let item = botState.audioQueueItems[0]
        if(item.message.member == null)
            throw new Error("member null")
        let voiceChannel = item.message.member.voice.channel
        if(voiceChannel == null)
            throw new Error("voiceChannel empty")
        let voiceConnection = getVoiceConnection(voiceChannel.guild.id)
        if(voiceConnection == null) {
            voiceConnection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: <DiscordGatewayAdapterCreator>voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: false,
            })
        }
        botState.audioStream = ytdl(item.url, {
            quality: "highestaudio",
            filter: "audioonly"
        })
        let audioResource = createAudioResource(botState.audioStream)
        voiceConnection.subscribe(botState.audioPlayer)

        botState.audioPlayer.play(audioResource)
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
                console.log("Buffering")
            })
            .on(AudioPlayerStatus.Playing, async () => {
                console.log("Playing")
            })
            .on(AudioPlayerStatus.Paused, async () => {
                console.log("Paused")
            })
            .on(AudioPlayerStatus.Idle, async () => {
                console.log("Idle")
                if(botState.audioQueueItems.length > 1) {
                    botState.audioQueueItems = botState.audioQueueItems.slice(1)
                    await this.playQueue(guildId)
                } else if(botState.audioQueueItems.length == 1) {
                    botState.audioQueueItems = botState.audioQueueItems.slice(1)
                    let voiceConnection = getVoiceConnection(guildId)
                    voiceConnection?.destroy()
                }
            })
            .on("unsubscribe", () => {
                console.log("unsubscribe")
            })
    }
}