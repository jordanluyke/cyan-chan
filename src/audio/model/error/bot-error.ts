export class BotError extends Error {
    constructor(public message: string, public sendMessage?: string) {
        super(message)
    }
}
