import { Message } from "discord.js"
import { RandomUtil } from "../../util/random-util"
import { MessageRouteHandler } from "../model/message-route-handler"

export class RollDie implements MessageRouteHandler {
    public async handle(message: Message, args: string[]): Promise<void> {
        try {
            if (args.length != 1)
                throw new Error("Invalid input")
            const inputSplit = args[0].split("d")
            const kilobytes = 64
            const bytes = kilobytes * 1024
            let numberRolls = 1
            if (inputSplit.length == 2) {
                numberRolls = parseInt(inputSplit[0])
                if (isNaN(numberRolls) || numberRolls <= 0)
                    throw new Error("Invalid input")
            }
            const maxValue = parseInt(inputSplit.slice(-1)[0])
            if (isNaN(maxValue) && maxValue <= 1)
                throw new Error("Invalid input")

            const rolls: number[] = []
            for (let i = 0; i < numberRolls; i++) {
                const roll = RandomUtil.generateNumber(1, maxValue, bytes)
                rolls.push(roll)
            }
            const total = rolls.reduce((previous, current) => previous + current, 0)
            const multiRollOutput = `[${rolls.join(", ")}] / [${maxValue}] = ${total}`

            await message.channel.send(`ଘ(੭ ˘ ᵕ˘)━☆ﾟ.*･｡ﾟ ♡ ${numberRolls > 1 ? multiRollOutput : total} ♡`)
        } catch(err) {
            await message.channel.send("Example: !uwuroll 2d8")
        }
    }
}

export class Commands implements MessageRouteHandler {
    public async handle(message: Message, args: string[]): Promise<void> {
        await message.channel.send([
            "!clear",
            "!download_messages",
            "!pause",
            "!play [search/url/playlist]",
            "!queue",
            "!replace [search/url/playlist]",
            "!skip",
            "!source",
            "!stop",
            "!uwuroll [dice/number]",
        ].join("\n"))
    }
}
