#!/usr/bin/env node

import * as childProcess from "child_process"
import * as fs from "fs/promises"
import * as path from "path"
import * as util from "util"
import glob from "glob"

const __dirname = path.resolve()

let removeOutputFolder = async () => {
    let stats = null
    try {
        stats = await fs.stat(path.join(__dirname, "target"))
    } catch(err) {
    }
    if(stats != null) {
        await fs.rm(path.join(__dirname, "target"), {
            recursive: true
        })
    }
}

let compile = async () => {
    let cmd = path.join(__dirname, "node_modules/.bin/tsc") + " -p " + path.join(__dirname, "tsconfig.json")
    let {stdout, stderr} = await util.promisify(childProcess.exec)(cmd)
    if(stderr) {
        console.log("Compile failed")
        throw stderr
    }
}

let appendJsOnImports = async () => {
    let files = await util.promisify(glob)("target/**/*.js")
    for(let file of files) {
        let data = await fs.readFile(file, 'utf8')
        let regex = /(import .* from\s+['"])([.]+.+)(?=['"])/g
        if(!data.match(regex)) continue
        let newData = data.replace(regex, '$1$2.js')
        await fs.writeFile(file, newData)
    }
}

// Build

console.log("Building...")

try {
    await removeOutputFolder()
    await compile()
    await appendJsOnImports()
} catch(err) {
    console.log(err)
    console.log("Exiting")
    process.exit(128)
}

console.log("Done")
