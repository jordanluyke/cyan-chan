import * as util from "util"

export class MiscUtil {

    public static async sleep(ms: number): Promise<void> {
        await util.promisify(setTimeout)(ms)
    }
}
