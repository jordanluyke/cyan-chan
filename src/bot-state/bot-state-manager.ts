import { singleton } from "tsyringe"
import { BotState } from "./model/bot-state"

@singleton()
export class BotStateManager {
    private botStates: Map<string, BotState> = new Map()

    public getState(guildId: string): BotState | undefined {
        return this.botStates.get(guildId)
    }

    public createState(guildId: string): BotState {
        if (this.getState(guildId) != null)
            throw new Error("Bot state already exists")
        let botState = new BotState()
        this.botStates.set(guildId, botState)
        return botState
    }

    public getStateOrThrow(guildId: string): BotState {
        let botState = this.botStates.get(guildId)
        if (botState == null)
            throw new Error("BotState null")
        return botState
    }
}
