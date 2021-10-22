import { Message } from "discord.js"
import { MiscUtil } from "../../../util/misc-util"
import { RandomUtil } from "../../../util/random-util"
import { MessageRouteHandler } from "../../model/message-route-handler"

export class RollDie implements MessageRouteHandler {
    public async handle(message: Message, args: string[]) : Promise<void> {
        try {
            let inputValue = args.length == 0 ? 100 : parseInt(args[0])
            if(isNaN(inputValue) || inputValue <= 1)
                throw new Error("Invalid roll input")
            let bytes = 256
            await message.channel.send(`ଘ(੭ ˘ ᵕ˘)━☆ﾟ.*･｡ﾟRoll using ${bytes*8} bits...`)
            await MiscUtil.sleep(2000)
            let result = RandomUtil.generateNumber(1, inputValue, bytes)
            await message.channel.send(`(❀˘꒳˘) ♡ ${result.toString()} ♡ (1-${inputValue})`)
        } catch(err) {
            await message.channel.send("Usage: !roll 20")
        }
    }
}

export class Commands implements MessageRouteHandler {
    public async handle(message: Message, args: string[]) : Promise<void> {
        try {
            await message.channel.send([
                "Commands:",
                "!clear",
                "!pause",
                "!play [search/url/playlist]",
                "!queue",
                "!skip",
                "!stop",
                "!uwuroll [number]",
            ].join("\n"))
        } catch(err) {
            console.error(err)
        }
    }
}
