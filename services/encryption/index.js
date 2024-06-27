const { spawn, Transfer, Worker } = require("threads")
const fs = require('fs')
const path = require('path')
const { RemoteEncryptionConfig: { AesConfig } } = require('../../resources/secret/encryptionConfig.json')

class EncryptionService{

    static get CurrentEncryptionVersion(){
        return 2
    }

    /**
     * @param {Buffer} data Data to be encrypted
     * @returns {Buffer} The encrypted data
     */
    static async Encrypt(data){
        return await this.EncryptV2(data)
    }

    /**
     * @param {Buffer} data The encrypted data
     * @param {number} version The encryption version used when encrypting
     * @returns {Buffer} The decrypted data
     */
    static async Decrypt(data, version){
        if(version === 1){
            return await this.DecryptV1(data)
        }else if(version === 2){
            return await this.DecryptV2(data)
        }else{
            throw new Error(`Unknow encryption version '${version}'`)
        }
    }

    // ------------------------------------------------------------


    /**
     * @param {Buffer} data Data to be encrypted
     * @returns {Buffer} The encrypted data
     */
    static async EncryptV2(data){
        const worker = await this.SpwanWorkerV2()
        const encryptedData = await worker.encrypt(Transfer(data.buffer), AesConfig.Key, AesConfig.IV)
        return Buffer.from(encryptedData)
    }


    /**
     * @param {Buffer} data The encrypted data
     * @returns {Buffer} The decrypted data
     */
    static async DecryptV2(data){
        const worker = await this.SpwanWorkerV2()
        const decryptedData = await worker.decrypt(Transfer(data.buffer), AesConfig.Key, AesConfig.IV)
        return Buffer.from(decryptedData)
    }

    
    /**
     * @param {Buffer} data Data to be encrypted
     * @returns {Buffer} The encrypted data
     */
    static async EncryptV1(data){
        const worker = await this.SpwanWorkerV1()
        const encryptedData = await worker.encrypt(Transfer(data.buffer), this.publicKey)
        return Buffer.from(encryptedData)
    }

    /**
     * @param {Buffer} data The encrypted data
     * @returns {Buffer} The decrypted data
     */
    static async DecryptV1(data){
        const worker = await this.SpwanWorkerV1()
        const decryptedData = await worker.decrypt(Transfer(data.buffer), this.privateKey)
        return Buffer.from(decryptedData)
    }

    static async SpwanWorkerV1(){
        return await spawn(new Worker("./encryptionWorkerV1"))
    }
    
    static async SpwanWorkerV2(){
        return await spawn(new Worker("./encryptionWorkerV2"))
    }


    static Init(){
        const privateKey = fs.readFileSync(path.join(__dirname, '../../resources/secret/privateKey.txt'), 'utf-8')
        const publicKey = fs.readFileSync(path.join(__dirname, '../../resources/secret/publicKey.txt'), 'utf-8')
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        // this._generateKeys()
    }

    static _generateKeys(){
        const NodeRSA = require('node-rsa')
        const rsa =  new NodeRSA({b: 2048})
        const privateKey = rsa.exportKey()
        const publicKey = rsa.exportKey('public')

        console.log(privateKey)
        console.log(publicKey)
    }

}

module.exports = EncryptionService;
EncryptionService.Init()