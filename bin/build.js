import * as childProcess from "child_process"
import * as fs from "fs/promises"
import * as path from "path"
import * as util from "util"
import { glob } from "glob"

(async () => {
    const __dirname = path.resolve()

    console.log("Building...")

    try {
        await removeOutputFolder()
        await compile()
        await appendJsOnImports()
    } catch(err) {
        console.log(err)
        console.log("Exiting")
        process.exit(1)
    }

    console.log("Done")

    async function removeOutputFolder() {
        try {
            await fs.rm(path.join(__dirname, "target"), {
                recursive: true
            })
        } catch(err) {
        }
    }

    async function compile() {
        const cmd = "npx tsc"
        const { stdout, stderr } = await util.promisify(childProcess.exec)(cmd)
        if (stderr) {
            console.log("Compile failed")
            throw stderr
        }
    }

    async function appendJsOnImports() {
        const files = await glob("target/**/*.js")
        for (const file of files) {
            const data = await fs.readFile(file, 'utf8')
            const regex = /(import .* from\s+['"])([.]+.+)(?=['"])/g
            if (!data.match(regex)) continue
            const newData = data.replace(regex, '$1$2.js')
            await fs.writeFile(file, newData)
        }
    }
})()
