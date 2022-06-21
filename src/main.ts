import "reflect-metadata"
import { container } from "tsyringe"
import { ApiManager } from "./api/api-manager"
import { Config } from "./config"

(async () => {
    let config = container.resolve(Config)
    let apiManager = container.resolve(ApiManager)
    await config.load()
    await apiManager.start()
})()
