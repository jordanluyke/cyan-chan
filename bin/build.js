import * as childProcess from "child_process"
import * as fs from "fs/promises"
import * as path from "path"
import * as util from "util"
import glob from "glob"

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
        let cmd = "npx tsc"
        let { stdout, stderr } = await util.promisify(childProcess.exec)(cmd)
        if(stderr) {
            console.log("Compile failed")
            throw stderr
        }
    }

    async function appendJsOnImports() {
        let files = await util.promisify(glob)("target/**/*.js")
        for(let file of files) {
            let data = await fs.readFile(file, 'utf8')
            let regex = /(import .* from\s+['"])([.]+.+)(?=['"])/g
            if(!data.match(regex)) continue
            let newData = data.replace(regex, '$1$2.js')
            await fs.writeFile(file, newData)
        }
    }
})()
