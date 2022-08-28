import { injectable } from "tsyringe"
import { Config } from "../config"
import { AudioQueueItem } from "./model/audio-queue-item"
import { AudioPlayerStatus, createAudioResource, DiscordGatewayAdapterCreator, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice"
import ytdl from "ytdl-core"
import { Message, PermissionFlagsBits } from "discord.js"
import { youtube_v3 } from "googleapis"
import { HttpUtil } from "../util/http-util"
import { BotStateManager } from "../bot-state/bot-state-manager"
import { BotState } from "../bot-state/model/bot-state"
import { TimeUnit } from "../util/time-unit"
import { BotError } from "./model/error/bot-error"
import { Readable } from "stream"
import { FfmpegUtil } from "../util/ffmpeg-util"
import { InputFlag } from "./model/input-flag"

@injectable()
export class AudioManager {

    constructor(
        private config: Config,
        private botStateManager: BotStateManager,
    ) {}

    public async play(message: Message, args: string[]): Promise<void> {
        if(message.guild == null)
            throw new BotError("guild null", "Guild not found")
        let guildId = message.guild.id
        let botState = this.getBotStateOrCreate(guildId)
        let queueItems = await this.buildQueueItemsFromInput(message, args)
        if(queueItems.length == 0 && args.length > 0) {
            await message.channel.send("No search results")
            return Promise.resolve()
        }
        botState.audioQueueItems = botState.audioQueueItems.concat(queueItems)
        if(botState.audioPlayer.state.status == AudioPlayerStatus.Paused) {
            botState.audioPlayer.unpause()
        } else if(botState.audioPlayer.state.status != AudioPlayerStatus.Playing) {
            return this.playNextInQueue(guildId)
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
        if(botState.audioQueueItems.length >= 1) {
            botState.audioPlayer.stop()
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
        return this.buildQueueItemsFromInput(message, args)
            .then(queueItems => {
                if(message.guild == null)
                    throw new BotError("guild null", "Guild not found")
                let botState = this.getBotStateOrCreate(message.guild.id)
                if(botState.audioQueueItems.length == 0)
                    throw new BotError("items empty", "No items in queue")
                if(queueItems.length == 0)
                    throw new BotError("queueItems empty", "No item found in input")
                botState.audioQueueItems[0] = queueItems[0]
                return this.playNextInQueue(message.guild.id)
            })
    }

    private async buildQueueItemsFromInput(message: Message, args: string[]): Promise<AudioQueueItem[]> {
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
        if(permissions == null || !permissions.has(PermissionFlagsBits.Connect) || !permissions.has(PermissionFlagsBits.Speak))
            throw new BotError("Invalid permissions", "I need connect and speak privileges :'(")
        if(args.length == 0)
            return []

        let inputFlags: InputFlag[] = []
        let remainingArgs: string[] = []
        let availableFlags = [
            new InputFlag("-p", true)
        ]
        let cmdFlagNames = availableFlags.map(pf => pf.name)

        for(let i = 0; i < args.length; i++) {
            if(!args[i].startsWith("-")) {
                remainingArgs = args.slice(i)
                break
            }
            let inputFlagIndex = cmdFlagNames.indexOf(args[i])
            if(inputFlagIndex == -1) {
                remainingArgs = args.slice(i)
                break
            }
            let inputFlag = availableFlags[inputFlagIndex]
            if(inputFlag.requiresValue)
                inputFlag.value = args[++i]
            inputFlags.push(inputFlag)
        }

        let queueItems: AudioQueueItem[] = []
        let youtube = new youtube_v3.Youtube({
            auth: this.config.youtubeApiKey
        })

        if(remainingArgs[0].match(/^https:\/\/.*youtube.com\/.+$/)) {
            let splitUrl = remainingArgs[0].split("?")
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
                if(res.data.items == null)
                    throw new BotError("playlist items null", "No items found in playlist")
                queueItems = res.data.items.map(item => {
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
                    if(voiceChannel == null)
                        throw new BotError("voiceChannel null", "Voice channel not found")
                    return new AudioQueueItem(title, videoId, message, inputFlags)
                })
            }
        } else {
            let searchTerms = remainingArgs.join(" ")
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
            let snippet = item.snippet
            if(snippet == null)
                throw new BotError("snippet null", "snippet not found")
            let title = snippet.title
            if(title == null)
                throw new BotError("title null", "title not found")
            let queueItem = new AudioQueueItem(title, videoId, message, inputFlags)
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

        let pitchScaleInput = item.inputFlags.filter(flag => flag.name == "-p")[0]?.value
        let pitchScale = typeof pitchScaleInput == "string" ? parseFloat(pitchScaleInput) : null

        console.log("Downloading:", item.title, item.getYoutubeUrl())

        this.getYoutubeVideo(item.videoId)
            .then(buffer => {
                if(pitchScale == null)
                    return Promise.resolve(buffer)
                return FfmpegUtil.shift(buffer, pitchScale)
            })
            .then(buffer => {
                console.log("Playing...")
                botState.audioPlayer.play(createAudioResource(Readable.from(buffer)))
                voiceConnection?.subscribe(botState.audioPlayer)
            })
    }

    private getYoutubeVideo(videoId: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            let chunks: Buffer[] = []
            ytdl(videoId, {
                quality: "highestaudio",
                filter: format => format.container === "mp4" && !format.hasVideo,
            })
                .on("error", (err: any) => {
                    throw new Error(err)
                })
                .on("data", (chunk: Buffer) => {
                    chunks.push(chunk)
                })
                .on("finish", () => {
                    resolve(Buffer.concat(chunks))
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
                    throw new BotError("queue empty", "Queue empty")
                let item = botState.audioQueueItems[0]
                await item.sendMessage("Audio stream fail ;;w;;")
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
                    return this.playNextInQueue(guildId)
            })
            .on("unsubscribe", () => {
                console.log("unsubscribe")
            })
    }
}
