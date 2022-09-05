import { Message } from "discord.js"
import { RandomUtil } from "../../../util/random-util"
import { MessageRouteHandler } from "../../model/message-route-handler"

export class RollDie implements MessageRouteHandler {
    public async handle(message: Message, args: string[]): Promise<void> {
        try {
            if(args.length != 1)
                throw new Error("Invalid input")
            let inputSplit = args[0].split("d")
            let kilobytes = 8
            let bytes = kilobytes * 1024
            let bits = bytes * 8
            let multiple = 1
            if(inputSplit.length == 2) {
                multiple = parseInt(inputSplit[0])
                if(isNaN(multiple) || multiple <= 0)
                    throw new Error("Invalid input")
            }
            let maxValue = parseInt(inputSplit.slice(-1)[0])
            if(isNaN(maxValue) && maxValue <= 1)
                throw new Error("Invalid input")

            await message.channel.send(`ଘ(੭ ˘ ᵕ˘)━☆ﾟ.*･｡ﾟ Roll using ${multiple > 1 ? multiple + " x " : ""}${bits} bits...`)

            let rolls: number[] = []
            for(let i = 0; i < multiple; i++) {
                let roll = RandomUtil.generateNumber(1, maxValue, bytes)
                rolls.push(roll)
            }
            let total = rolls.reduce((previous, current) => previous + current, 0)
            let multiRollOutput = `[${rolls.join(", ")}] / [${maxValue}] = ${total}`

            await message.channel.send(`(❀˘꒳˘) ♡ ${multiple > 1 ? multiRollOutput : total} ♡`)
        } catch(err) {
            await message.channel.send("Example: !uwuroll 2d8")
        }
    }
}

export class Commands implements MessageRouteHandler {
    public async handle(message: Message, args: string[]): Promise<void> {
        await message.channel.send([
            "!clear",
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
