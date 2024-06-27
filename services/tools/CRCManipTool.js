const ExternalProgramsService = require('../externalPrograms')

module.exports = class CRCManipTool{

    static get SupportedAlgorithms(){
        return Object.freeze(['CRC32', 'CRC32POSIX', 'CRC16CCITT', 'CRC16IBM'])
    }

    /**
     * @typedef FixOptions
     * @prop {'CRC32' | 'CRC32POSIX' | 'CRC16CCITT' | 'CRC16IBM'} algorithm
     * @prop {Buffer} data
     * @prop {string} targetChecksum
     * @prop {number} patchOffset
     * 
     * @param {FixOptions} options 
     * @returns 
     */
    static async FixChecksum(options){
        const { algorithm, data, targetChecksum, patchOffset } = options
        return await ExternalProgramsService.bufferThruFS(data,
            (inFile, outFile) => ExternalProgramsService.CRCManip({
                algorithm: algorithm,
                inputFilename: inFile,
                outputFilename: outFile,
                targetChecksum: targetChecksum,
                patchOffset: patchOffset
            })    
        )
    }

}