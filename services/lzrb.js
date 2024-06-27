const { readFile, writeFile, deleteFile } = require('../utils')
const temp = require('temp')
const ExternalProgramsService = require('./externalPrograms')

module.exports = class LZRBService{

    /**
     * @param {Buffer} buffer 
     * @returns {Buffer}
     */
    static async Compress(buffer){
        return await this._doAction('compress', buffer)
    }

    /**
     * @param {Buffer} buffer 
     * @returns {Buffer}
     */
     static async Decompress(buffer){
        return await this._doAction('decompress', buffer)
    }

    static async _doAction(action, buffer){
        var inFilename = temp.path()
        var outFilename = inFilename + '.out'
        await writeFile(inFilename, buffer)
        await ExternalProgramsService.lzrb(action, inFilename, outFilename)
        const outputBuffer = await readFile(outFilename)
        await Promise.all([
            deleteFile(inFilename),
            deleteFile(outFilename)
        ])
        return outputBuffer
    }

}