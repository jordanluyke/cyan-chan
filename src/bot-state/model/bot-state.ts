import { createAudioPlayer } from "@discordjs/voice"
import { Readable } from "stream"
import { AudioQueueItem } from "../../audio/model/audio-queue-item"

export class BotState {
    constructor(
        public audioQueueItems: AudioQueueItem[] = [],
        public audioPlayer = createAudioPlayer(),
        public audioStream?: Readable,
        public idleTimeout?: any,
    ) {}
}
