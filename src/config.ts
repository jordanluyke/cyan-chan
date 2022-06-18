import { singleton } from "tsyringe"
import * as fs from "fs/promises"

@singleton()
export class Config {
    public botToken = ""
    public youtubeApiKey = ""

    public async load(): Promise<void> {
        let configFile = JSON.parse(await fs.readFile("config/app.json", "utf8"))

        this.botToken = configFile["botToken"]
        this.youtubeApiKey = configFile["youtubeApiKey"]

        console.log("Config loaded")
    }
}
