import { MessageRoute } from "./model/message-route"
import { ClearAudioQueue, GetAudioQueue, getAudioSource, PauseAudio, PlayAudio, SkipAudio, StopAudio } from "./routes/message/audio-routes"
import { Commands, RollDie } from "./routes/message/misc-routes"

export class ApiV1 {

    constructor(
        public prefix = "!",
        public commandRoutes: MessageRoute[] = [
            new MessageRoute("commands", Commands),
            new MessageRoute("clear", ClearAudioQueue),
            new MessageRoute("pause", PauseAudio),
            new MessageRoute("play", PlayAudio),
            new MessageRoute("queue", GetAudioQueue),
            new MessageRoute("skip", SkipAudio),
            new MessageRoute("source", getAudioSource),
            new MessageRoute("stop", StopAudio),
            new MessageRoute("uwuroll", RollDie),
        ]
    ) {}
}
