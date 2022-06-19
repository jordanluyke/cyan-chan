import { createAudioPlayer } from "@discordjs/voice"
import { AudioQueueItem } from "../../audio/model/audio-queue-item"

export class BotState {
    constructor(
        public audioQueueItems: AudioQueueItem[] = [],
        public audioPlayer = createAudioPlayer(),
        public idleTimeout?: any,
    ) {}
}
