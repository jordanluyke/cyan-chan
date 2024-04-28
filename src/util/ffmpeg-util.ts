import ffmpeg from "fluent-ffmpeg"
import { Readable } from "stream"

export class FfmpegUtil {

    public static async shift(inBuffer: Buffer, scale: number, bitrate = 44100, format = "wav"): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = []
            console.log("Shifting pitch...")
            ffmpeg()
                .input(Readable.from(inBuffer))
                .audioBitrate(bitrate)
                .filterGraph(`asetrate=${bitrate}*${scale},aresample=${bitrate},atempo=1/${scale}`)
                .format(format)
                .on("error", err => {
                    reject(new Error(err))
                })
                .pipe()
                .on("data", chunk => {
                    chunks.push(chunk)
                })
                .on("end", () => {
                    resolve(Buffer.concat(chunks))
                })
        })
    }
}
