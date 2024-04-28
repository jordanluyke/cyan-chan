import "reflect-metadata"
import { container } from "tsyringe"
import { ApiManager } from "./api/api-manager"
import { Config } from "./config"

(async () => {
    const config = container.resolve(Config)
    const apiManager = container.resolve(ApiManager)
    await config.load()
    await apiManager.start()
})()
