const { ObjectId, GridFSBucket } = require('mongodb')

const path = require('path')
const fs = require('fs')
const { client, coll } = require('../db')
const { arrayToMap } = require('../utils')
const { Readable } = require('stream')

module.exports = class GenericEntriesService{
    
    /**
     * @typedef {string | { database: string, collection: string }} GroupNameType 
     */

    /**
     * @param {GroupNameType} groupName 
     * @param {import('mongodb').Filter<import('mongodb').Document> | undefined} filters 
     * @param {Record<string, boolean> | undefined} fields 
     * @returns {Promise<any[]>}
     */
    static async GetEntries(groupName, filters, fields){
        const cl = this.GetCollection(groupName)
        const docs = await cl.find(filters, { projection: fields }).toArray()
        const len = docs.length
        for(let i = 0; i < len; i++){
            if(docs[i].__$attachements === null){
                delete docs[i].__$attachements
            }
        }
        return docs
    }

    /**
     * @param {GroupNameType} groupName 
     * @param {import('mongodb').Filter<import('mongodb').Document> | undefined} filters 
     * @param {Record<string, boolean> | undefined} fields 
     * @returns {Promise<any>}
     */
     static async GetEntry(groupName, filters, fields){
        const cl = this.GetCollection(groupName)
        const doc = await cl.findOne(filters, { projection: fields })
        return doc
    }

    /**
     * @param {GroupNameType} groupName 
     * @param {any[]} entriesData 
     */
    static async SaveEntries(groupName, entriesData){
        return await Promise.all(
            entriesData.map(ed => this.SaveEntry(groupName, ed))
        )
    }

    /**
     * 
     * @param {GroupNameType} groupName 
     * @param {Record<string, any>} entryData 
     * @returns 
     */
    static async SaveEntry(groupName, entryData){
        const cl = this.GetCollection(groupName)
        const bucket = this.GetFSBucket(groupName)
        const IsExistingEntry = typeof entryData._id == 'string' || typeof entryData._id == 'object'
        const { _id, __$attachements, ...data } = entryData
        const existingAttachments = []
        const uploadTasks = []
        if(Array.isArray(__$attachements)){
            for(let i = 0; i < __$attachements.length; i++){
                const atch = __$attachements[i]
                const existing = typeof atch == 'object' && typeof atch.fileId == 'string'
                if(existing){
                    existingAttachments.push(atch)
                }else{
                    const index = i
                    uploadTasks.push(
                        async () => {
                            const dAtch = await this.UploadEntryAttachement(bucket, atch)
                            __$attachements[index] = dAtch
                        }
                    )
                } 
            }
        }
        if(IsExistingEntry){
            const currentDoc = await cl.findOne({ _id: ObjectId(_id) })
            const currentAttachments = currentDoc && currentDoc.__$attachements
            if(Array.isArray(currentAttachments)){
                const existingAttachmentsMap = arrayToMap(existingAttachments, item => item.fileId, () => true)
                const forDeletion = []
                for(let attachement of currentAttachments){
                    const keep = existingAttachmentsMap[attachement.fileId]
                    if(!keep){
                        forDeletion.push(attachement.fileId)
                    }
                }
                await Promise.all(forDeletion.map(fileId => bucket.delete(ObjectId(fileId))))
            }
        }
        await Promise.all(uploadTasks.map(task => task()))
        
        const insertData = {
            ...data,
            __$attachements
        }
        if(IsExistingEntry){
            await cl.updateOne(
                { _id: ObjectId(_id) },
                { $set: insertData }
            )
            return entryData
        }else{
            const result = await cl.insertOne(insertData)
            return {
                ...insertData,
                _id: result.insertedId
            }
        }
    }

    static async DeleteEntry(groupName, entryId){
        const cl = this.GetCollection(groupName)
        const bucket = this.GetFSBucket(groupName)
        const currentDoc = await cl.findOne({ _id: ObjectId(entryId) })
        const currentAttachments = currentDoc && currentDoc.__$attachements
        if(Array.isArray(currentAttachments)){
            await Promise.all(currentAttachments.map(a => bucket.delete(ObjectId(a.fileId))))
        }
        await cl.deleteOne({
            _id: ObjectId(entryId)
        })
    }

    /**
     * @param {GroupNameType} groupName 
     * @param {import('mongodb').Filter<import('mongodb').Document>} filters 
     */
    static async DeleteManyEntries(groupName, filters){
        const cl = this.GetCollection(groupName)
        const bucket = this.GetFSBucket(groupName)
        const deleteTasks = []
        const entriesIds = []
        const entries = await cl.find(filters, { projection: { __$attachements: true } }).toArray()
        const len = entries.length
        for(let i = 0; i < len; i++){
            const { _id, __$attachements: atts } = entries[i]
            entriesIds.push(ObjectId(_id))
            if(Array.isArray(atts)){
                const len2 = atts.length
                for(let j = 0; j < len2; j++){
                    deleteTasks.push(bucket.delete(ObjectId(atts[j].fileId)))
                }
            }
        }
        await Promise.all([
            Promise.all(deleteTasks),
            cl.deleteMany({ _id: { $in: entriesIds } })
        ])
    }
    
    /**
     * 
     * @param {GroupNameType} groupName 
     * @param {{fileId: string | ObjectId}} attachement 
     * @param {WritableStream} writeStream 
     * @returns 
     */
    static DownloadEntryAttachement(groupName, attachement, writeStream){
        return new Promise((resolve, reject) => {
            const bucket = this.GetFSBucket(groupName)
            const downloadStream = bucket.openDownloadStream(ObjectId(attachement.fileId))
            downloadStream.on('error', err => reject(err))
            writeStream.on('error', err => reject(err))
            writeStream.on('finish', () => resolve())
            downloadStream.pipe(writeStream)
        })
    }

    /**
     * @private
     * @param {GridFSBucket} fsBucket 
     * @param {{ displayFilename: string, binaryData: Buffer }} attachement 
     * @returns {Promise<{ fileId: string, displayFilename: string }>}
     */
    static UploadEntryAttachement(fsBucket, attachement){
        return new Promise((resolve, reject) => {
            const { displayFilename, binaryData } = attachement
            const uploadStream = fsBucket.openUploadStream(displayFilename)
            uploadStream.on('error', err => reject(err))
            uploadStream.on('finish', () => resolve({
                fileId: uploadStream.id.toString(),
                displayFilename
            }))
            const readStream = Readable.from(binaryData)
            readStream.pipe(uploadStream)
        })
    }

    /**
     * @public
     * @param {GroupNameType} groupName 
     */
    static GetCollection(groupName){
        if(typeof groupName === 'string'){
            return coll('generic_entries', groupName)
        }else{
            return coll(groupName.database, groupName.collection)
        }
    }

    /**
     * @private
     * @param {GroupNameType} groupName 
     */
    static GetFSBucket(groupName){
        if(typeof groupName === 'string'){
            return new GridFSBucket(client.db('generic_entries'), { bucketName: groupName })
        }else{
            return new GridFSBucket(client.db(groupName.database), { bucketName: groupName.collection })
        }
    }

}