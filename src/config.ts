import { singleton } from 'tsyringe'
import * as dotenv from 'dotenv'

@singleton()
export class Config {
    public botToken = ''
    public youtubeApiKey = ''

    public load(): void {
        dotenv.config()

        this.botToken = process.env.BOT_TOKEN || ''
        this.youtubeApiKey = process.env.YOUTUBE_API_KEY || ''

        console.log('Config loaded')
    }
}
