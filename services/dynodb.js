const CSVParser = require("../helpers/csvparser")
const GenericEntriesService = require('./genericEntries')
const { ObjectId } = require('mongodb')
const { stringIsNullOrEmpty } = require("../utils")
const { IsValidString, IsValidObject } = require("../jsutils")

module.exports = class DynoDbService{

    /**
     * @private
     */
    static get EntryStorageGroupName(){
        return 'dyno_db'
    }

    static get RunDataStorageGroupName(){
        return 'dyno_db_rundata'
    }

    static get ShopsListStorageGroupName(){
        return 'dynodb_shops';
    }

    /**
     * @typedef DynoBasicCarData
     * @property {string} shop
     * @property {string} make
     * @property {string} model
     * @property {string} year
     * @property {string} owner
     * 
     * @typedef DynoSerie
     * @property {string} name
     * @property {number[]} data
     * 
     * @typedef IdProp
     * @property {ObjectId} _id
     * 
     * @typedef {Object} DynoRunData
     * @property {string} _id
     * @property {string} entryId
     * @property {string} filename
     * @property {string} description
     * @property {DynoSerie[]} series
     * 
     * @typedef RunDataProp
     * @property {DynoRunData[]?} runDataItems
     * 
     * @typedef {DynoBasicCarData & IdProp} DynoBasicCarDataEntry
     * @typedef {DynoBasicCarDataEntry & RunDataProp} DynoCarDataEntry
     * 
     */

    /** @type {DynoCarDataEntry} */
    static Type_DynoCarDataEntry;

    /**
     * @param {import('mongodb').Filter<import('mongodb').Document> | undefined} filters 
     * @param {{ includeRunsDescriptions?: boolean }?} options
     * @returns {Promise<DynoCarDataEntry[]>}
     */
    static async GetEntries(filters, options){
        const { includeRunsDescriptions } = options || {}
        const entries = await GenericEntriesService.GetEntries(this.EntryStorageGroupName, filters)
        if(includeRunsDescriptions){
            await this._populateWithRunsDescriptions(entries)
        }
        return entries
    }

    /**
     * @param {DynoCarDataEntry[]} entries 
     */
     static async _populateWithRunsDescriptions(entries){
        const allIds = []
        const mapped = new Map()
        const len = entries.length
        for(let i = 0; i < len; i++){
            const entry = entries[i]
            const id = entry._id.toHexString()
            allIds.push(id)
            mapped.set(id, entry)
            entry.runDataItems = []
        }
        const runsData = await this.GetBatchRunsData(allIds)
        const len2 = runsData.length
        for(let i = 0; i < len2; i++){
            const { entryId, filename, description } = runsData[i]
            const entry = mapped.get(entryId)
            entry.runDataItems.push({ filename, description })
        }
    }
    
    /**
     * @param {import('mongodb').Filter<import('mongodb').Document> | undefined} filters 
     * @returns {Promise<DynoCarDataEntry>}
     */
    static async GetEntry(filters){
        const entry = await GenericEntriesService.GetEntry(this.EntryStorageGroupName, filters)
        return entry
    }

    /**
     * @typedef {Object} InputDynoRunData
     * @property {Buffer | string?} rawData
     * 
     * @param {DynoBasicCarData} carData 
     * @param {(DynoRunData & InputDynoRunData)[]} runDataItems
     * @returns {Promise<DynoCarDataEntry>}
     */
    static async AddEntry(carData, runDataItems){
        const { shop, make, model, year, owner, display_in_dyno_app } = carData
        const entryData = { shop, make, model, year, owner, display_in_dyno_app }
        const entry = await GenericEntriesService.SaveEntry(this.EntryStorageGroupName, entryData)
        const entryId = entry._id.toString()
        const runDataDocs = runDataItems.map(runData => this.InputRunDataToDoc(entryId, runData))
        await GenericEntriesService.SaveEntries(this.RunDataStorageGroupName, runDataDocs)
        return entry
    }

    /**
     * @param {string | ObjectId} entryId
     * @param {DynoBasicCarData} carData 
     * @param {(DynoRunData & InputDynoRunData)[]} runDataItems
     * @returns {Promise<DynoCarDataEntry>}
     */
    static async EditEntry(entryId, carData, runDataItems){
        const { shop, make, model, year, owner, display_in_dyno_app } = carData
        const entryData = { _id: entryId, shop, make, model, year, owner, display_in_dyno_app }
        const updatedEntry = await GenericEntriesService.SaveEntry(this.EntryStorageGroupName, entryData)
        const _entryId = updatedEntry._id.toString()
        const idsToKeep = []
        const docsToAdd = []
        const docsToUpdate = []
        for(let runData of runDataItems){
            const isNew = !IsValidString(runData._id) && !!runData.rawData
            if(isNew){
                docsToAdd.push(this.InputRunDataToDoc(_entryId, runData))
            }else{
                idsToKeep.push(runData._id)
                docsToUpdate.push(runData)
            }
        }
        const collection = GenericEntriesService.GetCollection(this.RunDataStorageGroupName)
        await collection.deleteMany({
            entryId: entryId.toString(),
            _id: {
                $nin: idsToKeep.map(id => ObjectId(id))
            }
        })
        await Promise.all(
            docsToUpdate.map(
                ({ _id, description }) => collection.updateOne(
                    { _id: ObjectId(_id) },
                    { $set: { description } }
                )
            )
        )
        if(docsToAdd.length > 0){
            // await collection.insertMany(docsToAdd)
            await GenericEntriesService.SaveEntries(this.RunDataStorageGroupName, docsToAdd)
        }
        return updatedEntry
    }

    /**
     * @param {string | ObjectId} entryId 
     * @param {DynoRunData & InputDynoRunData} runData 
     */
    static async AddRunData(entryId, runData){
        const runDataDoc = this.InputRunDataToDoc(entryId, runData)
        /** @type {DynoRunData} */
        const doc = await GenericEntriesService.AddEntry(this.RunDataStorageGroupName, runDataDoc)
        const { _id, filename, description, entryId: _entryId } = doc
        return { _id, filename, description, entryId: _entryId }
    }

    /**
     * @param {string | ObjectId} entryId 
     * @returns {Promise<Partial<DynoRunData>[]>}
     */
    static async GetRunsData(entryId){
        const runDataItems = await GenericEntriesService.GetEntries(
            this.RunDataStorageGroupName,
            { entryId: entryId.toString() },
            { filename: true, description: true, series: { name: true }, __$attachements: true }
        )
        return runDataItems
    }

    /**
     * @param {(string | ObjectId)[]} entriesIds 
     * @returns {Promise<Partial<DynoRunData>[]>}
     */
     static async GetBatchRunsData(entriesIds){
        const _entriesIds = []
        const len = entriesIds.length
        for(let i = 0; i < len; i++){
            _entriesIds.push(entriesIds[i].toString())
        }
        const runDataItems = await GenericEntriesService.GetEntries(
            this.RunDataStorageGroupName,
            { entryId: { $in: _entriesIds } },
            { entryId: true, filename: true, description: true }
        )
        return runDataItems
    }

    /**
     * @param {string | ObjectId} entryId
     * @param {string | ObjectId} runDataId
     * @returns {Promise<DynoSerie[]>} 
     */
    static async GetRunSeries(entryId, runDataId){
        const docs = await GenericEntriesService.GetEntries(
            this.RunDataStorageGroupName,
            { _id: ObjectId(runDataId), entryId: entryId.toString() },
            { series: true }
        )
        const doc = Array.isArray(docs) && docs[0]
        return doc.series || null
    }

    /**
     * @private
     * @param {string | ObjectId} entryId 
     * @param {DynoRunData & InputDynoRunData} runData 
     */
    static InputRunDataToDoc(entryId, runData){
        const { filename, description, rawData } = runData
        /** @type {DynoRunData} */
        const runDataDoc = {
            entryId: entryId,
            series: this.ExtractRunSeriesFromCSV(runData.rawData),
            filename: filename,
            description: description,
            __$attachements: [{
                displayFilename: filename,
                binaryData: Buffer.from(rawData, 'ascii')
            }]
        }
        return runDataDoc
    }

    /**
     * 
     * @param {string | ObjectId} entryId 
     */
    static async DeleteEntry(entryId){
        await GenericEntriesService.DeleteEntry(this.EntryStorageGroupName, entryId)
        await GenericEntriesService.DeleteManyEntries(
            this.RunDataStorageGroupName,
            { entryId: entryId.toString() }
        )
    }

    /**
     * @private
     * @param {Buffer | string} runData 
     * @returns {DynoSeria[]}
     */
    static ExtractRunSeriesFromCSV(runData){
        const params = [
            { name: 'HP', matchWords: ['HP', 'Power'] },
            { name: 'Torque', matchWords: ['Torque', 'Engine TQ', 'TQ'] },
            { name: 'AFR', matchWords: ['AFR', 'Air/Fuel Ratio'] },
            { name: 'Boost', matchWords: ['Boost', 'Ashcroft'] },
            { name: 'RPM', matchWords: ['RPM', 'Engine RPM'] },
            { name: 'MPH', matchWords: ['MPH'] },
            { name: 'Time', matchWords: ['Time'] },
        ]
        const getMatchingParam = header => {
            const nc = header.toLowerCase()
            for(let p of params){
                const matches = p.matchWords
                                .map(w => nc.includes(w.toLowerCase()))
                                .reduce((p, c) => p || c, false)
                if(matches) return p
            }
            return null
        }
        /** @type {Map<string, number[]>} */
        const seriesData = new Map()
        /** @type {{name: string, index: number}[]} */
        const matchedParams = []
        CSVParser.Parse(
            runData,
            headers => {
                for(let i = 0; i < headers.length; i++){
                    const param = getMatchingParam(headers[i])
                    if(param){
                        seriesData.set(param.name, [])
                        matchedParams.push({
                            name: param.name,
                            index: i
                        })
                    }
                }
            },
            row => {
                for(let i = 0; i < matchedParams.length; i++){
                    const mp = matchedParams[i]
                    const serieData = seriesData.get(mp.name)
                    const value = parseFloat(row[mp.index]) || 0
                    serieData.push(value)
                }
            }
        )
        const result = Array.from(seriesData.entries())
                        .map(([k, v]) => ({ name: k, data: v }))
        return result
    }

    static DownloadRunDataFile(fileId, writeStream){
        return GenericEntriesService.DownloadEntryAttachement(
            this.RunDataStorageGroupName,
            { fileId },
            writeStream
        )
    }

    /**
     * @returns {Promise<any[]>}
     */
    static async GetShops(){
        const shops = await GenericEntriesService.GetEntries(
            this.ShopsListStorageGroupName,
            null,
            { name: true, __$attachements: true }
        );
        shops.forEach(s => s._id = s._id.toString())
        return shops;
    }


    /**
     * 
     * @param {string} shopId 
     * @param {WritableStream} responseStream 
     */
    static async GetShopLogo(shopId, responseStream){
        const shops = await GenericEntriesService.GetEntries(this.ShopsListStorageGroupName, { _id: ObjectId(shopId) });
        const shop = Array.isArray(shops) && shops[0];
        const attachement = shop && Array.isArray(shop.__$attachements) && shop.__$attachements[0]
        if(!attachement) return false;
        await GenericEntriesService.DownloadEntryAttachement(
            this.ShopsListStorageGroupName,
            attachement,
            responseStream
        );
        return true;
    }

    static async GetShopEntries(shop){
        const entries = await this.GetEntries({ shop: shop._id.toString() })
        await Promise.all(
            entries.map(entry => (async () => entry.runDataItems = await this.GetRunsData(entry._id))())
        )
        return entries
    }

    static async EditEntryByShop(shop, entry){
        const shopId = shop._id.toString()
        const entryId = (entry._id || '').toString()
        const isExisting = IsValidString(entryId)
        if(isExisting){
            await this.ValidateEntryOwnershipByShop(shop, entryId)
        }
        entry.shop = shopId.trim()
        const { runDataItems, ...carData } = entry
        if(isExisting){
            return await this.EditEntry(entryId, carData, runDataItems)
        }else{
            return await this.AddEntry(carData, runDataItems)
        }
    }

    /**
     * @param {{ _id: string | ObjectId }} shop 
     * @param {string | ObjectId} entryId 
     */
    static async DeleteEntryByShop(shop, entryId){
        await this.ValidateEntryOwnershipByShop(shop, entryId)
        await GenericEntriesService.DeleteEntry(this.EntryStorageGroupName, entryId)
    }

    static async ValidateEntryOwnershipByShop(shop, entryId){
        const shopId = shop._id.toString()
        entryId = entryId.toString()
        const dbEntity = await this.GetEntry({ _id: ObjectId(entryId) })
        if(!IsValidObject(dbEntity)){
            throw new Error('Entry not found')
        }
        if(shopId !== dbEntity.shop){
            throw new Error(`Shop '${shopId}' is not the owner of entry '${entryId}'`)
        }
    }

}