const { ObjectId } = require("mongodb")
const fs = require('fs')
const temp = require('temp')
const TuneFileProtectionService = require('../services/tunefileProtection')
const { ShopService } = require("../services/shop")
const { IsValidString } = require("../jsutils")
const { deleteFile } = require("../utils")
const { FlashesBucket } = require("../services/tunes")

module.exports.downloadTuneFile = async (req, res) => {
    const { downloadTicket } = req.params
    try {
        const { id, folder, processor } = TuneFileProtectionService.verifyAndDecode(downloadTicket);
        const file = (await FlashesBucket.find({ _id: ObjectId(id) }).toArray())[0];
        res.set('Content-Type', 'application/octet-stream');
        const stream = FlashesBucket.openDownloadStream(ObjectId(id))
        const processStream = await processFileData(processor, stream)
        res.set('Content-Length', file.length + (IsValidString(processor) ? 102000 : 0))
        processStream.pipe(res)
    } catch (error) {
        if(error.isJwtError){
            res.status(401).send(error.message)
        }else{
            console.error(error)
            res.status(500).send('Internal Server Error')
        }
    }
}

function processFileData(processorName, stream){
    switch(processorName){
        case ShopService._PaddingProcessor:
            return addShopPadding2100(stream)
        default:
            return Promise.resolve(stream)
    }
}

/**
 * @param {import('stream').Readable} stream 
 * @returns {Promise<fs.ReadStream>}
 */
async function addShopPadding2100(stream){
    var tmpFilename = temp.path()
    const tmp = fs.createWriteStream(tmpFilename)
    const pad2k = Buffer.alloc(2000)
    const pad100k = Buffer.alloc(100000)
    pad2k.fill(0xFF)
    pad100k.fill(0xFF)
    await new Promise((resolve, reject) => {
        tmp.write(pad2k, (err) => {
            if(err) reject(err)
            else resolve()
        })
    })
    stream.pipe(tmp, { end: false })
    await new Promise((resolve, reject) => {
        stream.on('error', reject)
        stream.on('end', resolve)
    })
    await new Promise((resolve, reject) => {
        tmp.write(pad100k, (err) => {
            if(err) reject(err)
            else resolve()
        })
    })
    const s = fs.createReadStream(tmpFilename)
    s.on('end', () => {
        s.close()
        deleteFile(tmpFilename)
    })
    return s
}