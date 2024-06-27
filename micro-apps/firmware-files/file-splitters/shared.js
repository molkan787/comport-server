const AdmZip = require('adm-zip')
const { Readable } = require('stream')
const { StreamToBuffer } = require('../../../jsutils')

/**
 * Extracts blocks data (specified by offsets & lengths) and pack them into a zip format buffer
 * @param {import('../typings/file-spliter').SplitFileOptions} options 
 * @param {import('../typings/file-spliter').BlockInfo[]} blocks 
 * @returns {Promise<Readable>}
 */
async function ExtractBlocksToZip(options, blocks){
    const { fileData } = options
    const fileDataBuffer = await StreamToBuffer(fileData)
    const zip = new AdmZip()
    for(let n = 1; n <= blocks.length; n++){
        const blockInfo = blocks[n - 1]
        const blockData = fileDataBuffer.slice(blockInfo.Offset, blockInfo.Length)
        // adding metadata as zip's entry comment (argument #3)
        zip.addFile(`Block${n}.bin`, blockData, JSON.stringify({ Name: blockInfo.Name }))
    }
    const zipBuffer = await zip.toBufferPromise()
    return Readable.from(zipBuffer)
}

module.exports = {
    ExtractBlocksToZip
}