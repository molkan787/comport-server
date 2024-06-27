const KvsService = require("../kvs");

const { spawn, Transfer, Worker } = require("threads");
const { IsValidObject } = require("../../jsutils");

class MG1CryptoTool{

    /**
     * @param {Buffer} data 
     * @param {{ Key: string, IV: string }} aesConfig 
     * @returns 
     */
    static async Encrypt(data, aesConfig){
        const worker = await spawn(new Worker("../encryption/encryptionWorkerV2"));
        const encryptedData = await worker.encrypt(Transfer(data.buffer), aesConfig.Key, aesConfig.IV)
        return Buffer.from(encryptedData)
    }

    /**
     * 
     * @param {Buffer} data 
     * @param {{ softwareNumber: string }} options
     * @returns {Promise<Buffer>}
     */
    static async EncryptDefaultConfig(data, options){
        const config = await KvsService.GetValue('mg1_aes_config', options.softwareNumber)
        if(!IsValidObject(config)){
            throw new Error(`AES Key & IV for '${options.softwareNumber}' not found.`)
        }
        return await this.Encrypt(data, {
            Key: config.key,
            IV: config.iv
        })
    }

}

module.exports = {
    MG1CryptoTool
}