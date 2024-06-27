const { readFile, writeFile, deleteFile } = require('../utils')
const temp = require('temp')
const ExternalProgramsService = require('./externalPrograms')

module.exports = class CRC32PatcherService{

    /**
     * @param {Buffer} buffer 
     * @returns {Buffer}
     */
    static async Patch(buffer, options){
        const { targetChecksum, patchOffset } = options
        return await this._doAction(buffer, targetChecksum, patchOffset)
    }

    static async _doAction(buffer, targetChecksum, patchOffset){
        var inFilename = temp.path()
        var outFilename = inFilename + '.out'
        await writeFile(inFilename, buffer)
        await ExternalProgramsService.CRC32Patcher(inFilename, outFilename, targetChecksum, patchOffset)
        const outputBuffer = await readFile(outFilename)
        await Promise.all([
            deleteFile(inFilename),
            deleteFile(outFilename)
        ])
        return outputBuffer
    }

}