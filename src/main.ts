import 'reflect-metadata'
import { container } from 'tsyringe'
import { ApiManager } from './api/api-manager.js'

async function main() {
    try {
        await container.resolve(ApiManager).init()
    } catch (err) {
        console.error(err)
    }
}

main()
