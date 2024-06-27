const { CloneBuffer } = require("../jsutils")
const LZRBService = require("./lzrb")
const { MG1CryptoTool } = require("./tools/MG1CryptoTool")


class FlashDataPackerService{

    /**
     * @typedef {{ MicroName: string, SoftwareNumber: string, Padding: string }} PackOptions 
     */

    /**
     * @param {Buffer} data 
     * @param {PackOptions} options 
     */
    static async Pack(data, options){
        const packer = this._Packers[options.MicroName]
        if(typeof packer === 'function'){
            const packedData = await packer(data, options)
            return packedData
        }
        throw new Error(`Unsupported micro '${options.MicroName}'`)
    }

    /**
     * @type {{[MicroName: string]: (data: Buffer, options: PackOptions) => Promise<Buffer>}}
     */
    static _Packers = Object.freeze({
        'MG1CS002_BETA': this.MG1CS002_VAG_Packer,
        'MG1CS002_VAG': this.MG1CS002_VAG_Packer,
        'MG1CP007_992': this.MG1CS002_VAG_Packer,
        'MG1CS002_971': this.MG1CS002_VAG_Packer,
        'MG1CS002_971_NEW': this.MG1CS002_VAG_Packer,
    })
    
    /**
     * @param {Buffer} data 
     * @param {PackOptions} options 
     */
    static async MG1CS002_VAG_Packer(data, options){
        const { SoftwareNumber } = options
        let compressed = await LZRBService.Compress(data)
        const lastPartSize = compressed.length % 16
        const padLength = lastPartSize > 0 ? (16 - lastPartSize) : 0
        if(padLength !== 0){
            const binPadding = Buffer.alloc(padLength)
            binPadding.fill(padLength)
            compressed = Buffer.concat([compressed, binPadding])
        }
        compressed = CloneBuffer(compressed)
        const encrypted = await MG1CryptoTool.EncryptDefaultConfig(compressed, { softwareNumber: SoftwareNumber })
        return encrypted
    }

}

module.exports = {
    FlashDataPackerService
}