import { randomBytes } from 'crypto'

const eligibleCharacters = '123456789ABCDEFGHJLMNPQRTUVWXYZ'

export class RandomUtil {
    public static generateId(length: number): string {
        let result = ''
        for (let i = 0; i < length; i++)
            result += eligibleCharacters.charAt(
                this.generateNumber(0, eligibleCharacters.length, 8)
            )
        return result
    }

    public static generateNumber(min: number, max: number, numberBytes: number = 128): number {
        const value = randomBytes(numberBytes).readUInt32LE() / 0x100000000
        return Math.floor(value * (max - min + 1) + min)
    }
}
