const fs = require('fs')
const path = require('path')
const config = require('../config.json')
const { client, coll } = require('../db')
const KvsService = require('./kvs')
const { GridFSBucket, ObjectId, GridFSBucketReadStream } = require('mongodb')
const cron = require('node-cron')
const ReleasesHistoryService = require('./releasesHistory')

const MICRO_HASHES_CACHE_STORAGE_KEY = 'micros-defs-hashes';

class MicrosDefinitionsService{

    /**
     * Return compilied (dll) definition of the specified microcontroller
     * @deprecated
     * @param {string} microType 
     * @param {string} microModel 
     * @returns {Promise<fs.ReadStream | null>}
     */
    static async GetCompiledDefinition(microType, microModel){
        microModel = this.PrepareMicroModelName(microModel)
        const { valid_micro_types } = config.micros_definitions
        if(!valid_micro_types.includes(microType)){
            throw new Error(`Invalid micro type "${microType}".`)
        }
        const fsBucket = this.GetBucket(microType)
        const file = await this.GetMicroDefFile(fsBucket, microModel)
        if(!file){
            // throw Error(`Micro definition not found "${microModel}"`)
            return null
        }
        const stream = fsBucket.openDownloadStream(ObjectId(file._id))
        return stream
    }

    /**
     * @deprecated
     * @param {string} microType 
     * @param {string} microModel 
     * @param {fs.ReadStream} dataStream 
     * @returns {Promise<void>}
     */
    static async SetCompiledDefinition(microType, microModel, dataStream){
        microModel = this.PrepareMicroModelName(microModel)
        const { valid_micro_types } = config.micros_definitions
        if(!valid_micro_types.includes(microType)){
            throw new Error(`Invalid micro type "${microType}".`)
        }
        const fsBucket = this.GetBucket(microType)
        const file = await this.GetMicroDefFile(fsBucket, microModel)
        if(!!file){
            await fsBucket.delete(ObjectId(file._id))
        }
        const uploadStream = fsBucket.openUploadStream(microModel)
        dataStream.pipe(uploadStream)
        await new Promise((resolve, reject) => {
            dataStream.on('end', () => resolve())
            dataStream.on('error', () => reject())
        })
    }

    /**
     * @typedef {Object} CompiledDefinitionInfo
     * @property {string} microType
     * @property {string} microModel
     * @property {string} appName
     * @property {string} appVersion
     * @property {string?} microSourceHash
     */

    /**
     * @param {CompiledDefinitionInfo} definitionInfo 
     * @returns {Promise<GridFSBucketReadStream | null>}
     */
    static async GetCompiledMicroDefinition(definitionInfo){
        const fsBucket = this.GetExtendedBucket(definitionInfo)
        const file = await this.GetExtendedMicroDefFile(fsBucket, definitionInfo)
        if(file){
            return fsBucket.openDownloadStream(ObjectId(file._id))
        }else{
            return null
        }
    }

    /**
     * @param {fs.ReadStream} dataStream 
     * @param {CompiledDefinitionInfo} definitionInfo 
     * @returns {Promise<void>}
     */
     static async AddCompiledMicroDefinition(dataStream, definitionInfo){
        const { microType } = definitionInfo;
        const { valid_micro_types } = config.micros_definitions
        if(!valid_micro_types.includes(microType)){
            throw new Error(`Invalid micro type "${microType}".`)
        }
        const fsBucket = this.GetExtendedBucket(definitionInfo)
        const file = await this.GetExtendedMicroDefFile(fsBucket, definitionInfo)
        if(!!file){
            await fsBucket.delete(ObjectId(file._id))
        }
        const filename = this.GetMicroDefFileName(definitionInfo)
        const uploadStream = fsBucket.openUploadStream(filename)
        dataStream.pipe(uploadStream)
        await new Promise((resolve, reject) => {
            dataStream.on('end', () => resolve())
            dataStream.on('error', () => reject())
        })
        // await this.AddMicroDefSourceHash(definitionInfo)
    }

    /**
     * @param {{appName: string, appVersion: string}} appInfo 
     * @param {{microType: string, microModel: string}[]} microsList 
     * @returns {Promise<{microType: string, microModel: string}[]>} Returns list of resued micros (micros that were not reused/ported won't be included in the list)
     */
    static async ReuseCompiledMicrosDefinitions(appInfo, microsList){
        const latestRelease = await ReleasesHistoryService.GetLatestRelease(appInfo.appName)
        if(!latestRelease) return []
        const existingDefsBucket = this.GetExtendedBucket({
            appName: latestRelease.appName,
            appVersion: latestRelease.appVersion
        })
        const newDefsBucket = this.GetExtendedBucket(appInfo)
        const tasks = []
        const microsNSes = microsList.map(m => this.GetMicroDefFileName(m))
        const files = await existingDefsBucket.find({
            filename: { $in: microsNSes }
        }).toArray()
        const portedFiles = new Map()
        for(let file of files){
            portedFiles.set(file.filename, true)
            tasks.push((() => new Promise((resolve, reject) => {
                const ds = existingDefsBucket.openDownloadStream(ObjectId(file._id))
                const us = newDefsBucket.openUploadStream(file.filename)
                us.on('error', reject)
                us.on('finish', resolve)
                ds.pipe(us)
            }))())
        }
        await Promise.all(tasks)
        const portedMicros = []
        for(let m of microsList){
            const ns = this.GetMicroDefFileName(m)
            if(portedFiles.get(ns)) portedMicros.push(m)
        }
        return portedMicros
    }

    /**
     * @private
     * @param {string} microModel 
     * @returns {string}
     */
    static PrepareMicroModelName(microModel){
        return microModel.trim().replace(/\s/g, '_').toUpperCase()
    }

    /**
     * @private
     * @param {CompiledDefinitionInfo} definitionInfo 
     * @returns {GridFSBucket}
     */
    static GetExtendedBucket(definitionInfo){
        const { appName, appVersion } = definitionInfo
        const bucketName = this.GetAppNameVersionSlug(appName, appVersion);
        return new GridFSBucket(client.db('microsdefs'), { bucketName: bucketName })
    }

    /**
     * @private
     * @param {string} appName 
     * @param {string} appVersion 
     * @returns {string}
     */
    static GetAppNameVersionSlug(appName, appVersion){
        return `${appName}_${appVersion}`
    }

    /**
     * @private
     * @param {string} microType 
     * @returns {GridFSBucket}
     */
    static GetBucket(microType){
        return new GridFSBucket(client.db('microsdefs'), { bucketName: microType })
    }

    /**
     * @private
     * @param {GridFSBucket} bucket 
     * @param {string} microModel 
     * @returns {import('mongodb').GridFSFile}
     */
    static async GetMicroDefFile(bucket, microModel){
        const files = await bucket.find({ filename: microModel.toUpperCase() }).toArray()
        const file = files[0] || null
        return file;
    }

    /**
     * @private
     * @param {GridFSBucket} bucket 
     * @param {CompiledDefinitionInfo} definitionInfo 
     * @returns {Promise<import('mongodb').GridFSFile | null>}
     */
     static async GetExtendedMicroDefFile(bucket, definitionInfo){
        const filename = this.GetMicroDefFileName(definitionInfo);
        const files = await bucket.find({ filename: filename }).toArray()
        const file = files[0] || null
        return file;
    }


    /**
     * @private
     * @param {CompiledDefinitionInfo} definitionInfo 
     * @returns {string}
     */
    static GetMicroDefFileName(definitionInfo){
        const { microType, microModel } = definitionInfo
        return `${microType.toUpperCase()}_${microModel.toUpperCase()}`;
    }
    

    // -------------------------- Cleaning logic ---------------------------

    /**
     * @jobclass cleaing
     * Deletes micro definitions of older releases
     */
     static async CleanOldDefs(){
        const releases = await ReleasesHistoryService.GetObsoleteRelease()
        for(let release of releases){
            const bucket = this.GetExtendedBucket({
                appName: release.appName,
                appVersion: release.appVersion
            })
            await bucket.drop()
        }
    }


    // ----------------- Definition source code hash cache -----------------

    /**
     * @param {CompiledDefinitionInfo} definitionInfo 
     * @param {string} microSourceHash
     * @returns {Promise<void>}
     */
    static async AddMicroDefSourceHash(definitionInfo){
        const { appName, appVersion, microSourceHash } = definitionInfo
        const appSlug = this.GetAppNameVersionSlug(appName, appVersion)
        const microSlug = this.GetMicroDefFileName(definitionInfo)
        const groupName = `${MICRO_HASHES_CACHE_STORAGE_KEY}_${appSlug}`
        await KvsService.SetValue(groupName, microSlug, microSourceHash)
    }

    /**
     * @param {string} appName 
     * @param {string} appVersion 
     * @returns {Promise<void>}
     */
    static async GetMicrosDefsSourceHashes(appName, appVersion){
        const appSlug = this.GetAppNameVersionSlug(appName, appVersion)
        const groupName = `${MICRO_HASHES_CACHE_STORAGE_KEY}_${appSlug}`
        const items = await KvsService.GetAllGroupValues(groupName)
        return items
    }

}

module.exports = MicrosDefinitionsService

// Schedule cleaning evey week (on each Sunday)
cron.schedule('* * * * * 0', () => MicrosDefinitionsService.CleanOldDefs())