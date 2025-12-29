import 'reflect-metadata'
import { container } from 'tsyringe'
import { ApiManager } from './api/api-manager.js'
import { Config } from './config.js'

async function main() {
    const config = container.resolve(Config)
    const apiManager = container.resolve(ApiManager)
    config.load()
    await apiManager.start()
}

main()
