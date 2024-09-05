const { grabData } = require('../../helpers/text-kelpers')
const ExternalProgramsService = require('../externalPrograms')
const SecurityAlgorithmsService = require('../securityAlgorithms')

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
     * @prop {string?} polynomial
     * 
     * @param {FixOptions} options 
     * @returns 
     */
    static async FixChecksum(options){
        const { algorithm, data, targetChecksum, patchOffset, polynomial } = options
        return await ExternalProgramsService.bufferThruFS(data,
            (inFile, outFile) => ExternalProgramsService.CRCManip({
                algorithm: algorithm,
                inputFilename: inFile,
                outputFilename: outFile,
                targetChecksum: targetChecksum,
                patchOffset: patchOffset,
                polynomial: polynomial,
            })    
        )
    }
    
    /**
     * @typedef ComputePatchOptions
     * @prop {'CRC32' | 'CRC32POSIX' | 'CRC16CCITT' | 'CRC16IBM'} algorithm
     * @prop {Buffer} data
     * @prop {string} targetChecksum
     * @prop {number} patchOffset
     * @prop {string?} polynomial
     * 
     * @param {ComputePatchOptions} options 
     * @returns {Promise<string>}
     */
    static async ComputePatch(options){
        const { algorithm, data, targetChecksum, patchOffset, polynomial } = options
        const output = await ExternalProgramsService.bufferThruFSInOnly(data,
            (inFile) => ExternalProgramsService.CRCManip({
                command: 'computePatch',
                algorithm: algorithm,
                inputFilename: inFile,
                targetChecksum: targetChecksum,
                patchOffset: patchOffset,
                polynomial: polynomial,
            })    
        )
        const patchData = grabData(output, 'output_data:')
        return patchData
    }

}