import { MessageRoute } from "./model/message-route"
import { ClearAudioQueue, GetAudioQueue, GetAudioSource, PauseAudio, PlayAudio, ReplaceAudioQueueItem, SkipAudio, StopAudio } from "./routes/audio-routes"
import { Commands, RollDie } from "./routes/misc-routes"
import { DownloadMessages } from "./routes/channel-routes"

export class ApiV1 {

    constructor(
        public prefix = "!",
        public commandRoutes: MessageRoute[] = [
            new MessageRoute("cyan", Commands),
            new MessageRoute("clear", ClearAudioQueue),
            new MessageRoute("download_messages", DownloadMessages),
            new MessageRoute("pause", PauseAudio),
            new MessageRoute("play", PlayAudio),
            new MessageRoute("queue", GetAudioQueue),
            new MessageRoute("replace", ReplaceAudioQueueItem),
            new MessageRoute("skip", SkipAudio),
            new MessageRoute("source", GetAudioSource),
            new MessageRoute("stop", StopAudio),
            new MessageRoute("uwuroll", RollDie),
        ]
    ) {}
}
