const { GridFSBucket } = require('mongodb')
const { client } = require('../db')

class FilesStorageService{

    /**
     * @typedef {object} AddFilePayload
     * @property {string} GroupId
     * @property {import('stream').Readable} InputFileStream
     * @property {string} FileName
     * @property {Record<string, any>?} Metadata
     * @param {AddFilePayload} payload 
     */
    static async AddFile(payload){
        const { GroupId, InputFileStream, FileName, Metadata } = payload
        const bucket = this._GetFsBucket()
        const upStream = bucket.openUploadStream(
            FileName,
            {
                metadata: {
                    ...Metadata,
                    groupId: GroupId
                }
            }
        )
        await new Promise((resolve, reject) => {
            upStream.on('finish', resolve)
            upStream.on('error', reject)
            InputFileStream.pipe(upStream)
        })
    }

    static async GetFiles(groupId){
        const bucket = this._GetFsBucket()
        const docs = await bucket.find()
        return docs.map(d => {
            const { groupId, ...rMetadata } = d.metadata
            return {
                _id: d._id,
                FileName: d.filename,
                GroupId: groupId,
                Metadata: rMetadata
            }
        })
    }

    static _GetFsBucket(){
        const db = client.db('storage')
        const bucket = new GridFSBucket(db, { bucketName: 'generic-files-storage' })
        return bucket
    }

}

module.exports = {
    FilesStorageService
}