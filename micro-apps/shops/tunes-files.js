const { StreamToBuffer } = require('../../jsutils');
const { Readable } = require('stream');
const { ObjectId } = require('mongodb');
const { FoldersCollection, FlashesBucket, GetFolderIdByName } = require('../../services/tunes');
const { coll } = require('../../db');
const { AllowRefNumbers } = require('../../dynamic_config');

class TunesFilesService{

    static Init(dbClient){
        
    }

    /**
     * @private
     * @param {string} referenceNumber 
     * @returns {Promise<ReadableStream | null>}
     */
    static async GetRawStockFile(referenceNumber){
        const tuneFile = await this.FindStockFile(referenceNumber)
        if(tuneFile){
            const downloadStream = FlashesBucket.openDownloadStream(ObjectId(tuneFile.id))
            return downloadStream
        }
        return null
    }

    /**
     * @public
     * @param {string} referenceNumber 
     */
     static async FindStockFile(referenceNumber){
        const folders = await FoldersCollection.find().toArray()
        let folderName = null
        const collName = referenceNumber.replace(/\ /g, '_')
        for(let i = 0; i < folders.length; i++){
            const n = folders[i].name
            if(n.length >= 10 && n.endsWith(collName)){
                folderName = n
                break
            }
        }
        if(typeof folderName == 'string' && folderName.length > 0){
            const folderId = await GetFolderIdByName(folderName)
            if(!folderId) return null
            const files = await FlashesBucket.find({
                filename: {
                    $regex: new RegExp(`^${referenceNumber} stock`, 'i')
                },
                'metadata.folderId': folderId
            }).toArray()
            if(files.length > 0){
                const f = files[0]
                const { folderId, sortOrder, ...cMetadata } = f.metadata
                return {
                    id: f._id,
                    folder: folderName,
                    name: f.filename,
                    sortOrder: sortOrder,
                    metadata: cMetadata
                }
            }
        }
        return null
    }

    /**
     * @param {string} referenceNumber 
     * @param {string} shopId 
     */
    static async GetShopStockFile(referenceNumber, shopId){
        if(! await this.IsReferenceNumberAllowed(referenceNumber, shopId)){
            return // Ref number is not allowed globally or for current shop
        }
        const fileStream = await this.GetRawStockFile(referenceNumber)
        if(fileStream === null) return null
        return await this.UnpackShopFile(referenceNumber, fileStream)
    }

    /**
     * @private
     * @param {string} referenceNumber 
     * @param {ReadableStream} inputStream 
     * @returns {ReadableStream}
     */
    static async UnpackShopFile(referenceNumber, inputStream){
        const needSanitization = referenceNumber.startsWith('971907551L')
        if(needSanitization){
            const data = await StreamToBuffer(inputStream)
            const sanitizedData = data.slice(0x62C000, 0x180000)
            return Readable.from(sanitizedData)
        }else{
            return inputStream
        }
    }

    /**
     * @param {string} referenceNumber 
     * @param {ReadableStream} shopInputStream 
     * @returns 
     */
    static async RepackShopFile(referenceNumber, shopInputStream){
        const needRepacking = referenceNumber.startsWith('971907551L')
        if(needRepacking){
            const stockRawData = await StreamToBuffer(await this.GetRawStockFile(referenceNumber))
            const shopData = await StreamToBuffer(shopInputStream)
            shopData.copy(stockRawData, 0x62C000)
            return Readable.from(stockRawData)
        }else{
            return shopInputStream
        }
    }

    /**
     * @public
     * @param {string} referenceNumber 
     * @param {Record<string, any>} filters 
     */
    static async IsReferenceNumberAllowed(referenceNumber, shopId){
        const shopData = await coll('comport', 'shops').findOne({ _id: ObjectId(shopId) })
        // ---------- filter ----------
        const globalFilters = AllowRefNumbers
        const userFilters = shopData.allowed_reference_numbers || []
        const search = referenceNumber.substring(0, 6)
        if(globalFilters){
            const exists = globalFilters.includes(search)
            if(!exists) return false
        }
        if(userFilters){
            const exists = userFilters.includes(search)
            if(!exists) return false
        }
        // ----------------------------
        return true
    }

}

module.exports = {
    TunesFilesService
}