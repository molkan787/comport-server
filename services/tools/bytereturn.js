const { GridFSBucket } = require("mongodb")
const { client } = require("../../db")
const { slice } = require('stream-slice')

class ByteReturnService{

    static async getBytes(filesDbName, fileName, offset, length){
        const readStream = await this._findFile(filesDbName, fileName)
        if(readStream){
            return readStream.pipe(slice(offset, offset + length))
        }else{
            return null
        }
    }

    /**
     * Finds and return a readable stream for the file specified by the it's name and parent folder name (flash database)
     * @param {string} filesDbName 
     * @param {string} fileName 
     * @returns {Promise<ReadableStream>}
     */
    static async _findFile(filesDbName, fileName){
        const filesDb = client.db('flash_files')
        const folderDoc = await filesDb.collection('folders').findOne({
            name: filesDbName,
        })
        if(folderDoc){
            const bucket = new GridFSBucket(filesDb, { bucketName: 'flashes' })
            const files = await bucket.find({
                filename: fileName,
                metadata: {
                    folderId: folderDoc._id.toString()
                }
            }).toArray()
            if(files.length > 0){
                const readStream = bucket.openDownloadStream(files[0]._id)
                return readStream
            }
        }
        return null
    }

}

module.exports = {
    ByteReturnService
}