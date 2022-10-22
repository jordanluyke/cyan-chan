import { randomBytes } from "crypto"
import BigNumber from "bignumber.js"

const eligibleCharacters = "123456789ABCDEFGHJLMNPQRTUVWXYZ"

export class RandomUtil {

    public static generateId(length: number): string {
        let result = ""
        for(let i = 0; i < length; i++)
            result += eligibleCharacters.charAt(this.generateNumber(0, eligibleCharacters.length, 8))
        return result
    }

    public static generateNumber(min: number, max: number, byteSize: number=128): number {
        let _min = new BigNumber(min)
        let _max = new BigNumber(max)
        let bytes = randomBytes(byteSize)
        let value = this.bytesToNumber(bytes)
        let maxByteValue = this.maxByteValue(byteSize)
        return value
            .div(maxByteValue)
            .times(_max.minus(_min).plus(1))
            .plus(_min)
            .integerValue(BigNumber.ROUND_FLOOR)
            .toNumber()
    }

    private static bytesToNumber = function(byteArray: Buffer): BigNumber {
        return byteArray.reverse().reduce((previous, current) => {
            return previous.times(256).plus(current)
        }, new BigNumber(0))
    }

    private static maxByteValue = function(size: number): BigNumber {
        return new BigNumber(256).exponentiatedBy(size).minus(1)
    }
}
