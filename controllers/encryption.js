const EncryptionService = require('../services/encryption')

const MAX_SIZE = 1024 * 1024 * 32 // 32mb
// const MAX_SIZE = 1024 * 1024 * 3 // 3mb

module.exports.encrypt = (req, res) => {
    console.log('body', req.body)
    handleRequest(req, res, buf => EncryptionService.Encrypt(buf))
}

module.exports.decrypt = (req, res) => {
    const encVer = parseInt(req.headers['encryption-version'] || '1')
    handleRequest(req, res, buf => EncryptionService.Decrypt(buf, encVer))
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {(buf: Buffer) => Promise<Buffer>} dataTransformer
 */
async function handleRequest(req, res, dataTransformer){
    try {
        const transformedData = await dataTransformer(req.body)
        res.set('encryption-version', EncryptionService.CurrentEncryptionVersion.toString())
        res.status(200)
        res.send(transformedData)
    } catch (error) {
        console.error(error)
        res.status(500).send('Something went wrong, Please try again')
    }
}
