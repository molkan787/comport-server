const { client } = require('../db')
const { GridFSBucket, ObjectId } = require('mongodb')

const tunesTypesFilters = [
    { prop: 'stage_1', searchText: 'stage 1' },
    { prop: 'stage_2', searchText: 'stage 2' },
    { prop: 'burble', searchText: 'burble' },
    { prop: 'octane_91', searchText: '91 octane' },
    { prop: 'octane_93', searchText: '93 octane' },
    { rootProp: 'load_tcu_tunes', searchText: 'tcu -' },
    { rootProp: 'load_cpc_tunes', searchText: 'cpc -' },
]

function FilterTunesForCustomer(tunes, customer){
    let result = [].concat(tunes)
    const { enabled_tunes } = customer
    for(let ttf of tunesTypesFilters){
        const enabled = typeof ttf.rootProp == 'string' ? !!customer[ttf.rootProp] : !!enabled_tunes[ttf.prop]
        if(!enabled){
            for(let i = result.length - 1; i >= 0; i--){
                const isThat = result[i].name.toLowerCase().includes(ttf.searchText)
                if(isThat) result.splice(i, 1)
            }
        }
    }
    return result
}

const DB_NAME = 'flash_files' // 'firmwares'
const FirmwareDB = client.db(DB_NAME)
const FlashesBucket = new GridFSBucket(FirmwareDB, { bucketName: 'flashes' })
const FlashesCollection = FirmwareDB.collection('flashes.files')
const FoldersCollection = FirmwareDB.collection('folders')

const FlashFolderType = Object.freeze({
    Global: 'global',
    CustomerCustom: 'customer-custom',
    Shop: 'shop'
})


async function getSpecialFile(query){
    const { microType, microModel, fileType, versionNumber } = query
    const folderName = `${microType}_${fileType}`
    const fileName = `${microModel}_${versionNumber}`
    const files = await getFlashes(folderName)
    const targetFile = files.find(file => {
        const name = file.name.toLowerCase().replace(/\s/g, '')
        if(name.startsWith(fileName)) return file
    })
    return targetFile
}

async function getFlashes(folderName, options) {
    const { includeMetadata, filters } = options || {}
    const folderId = await GetFolderIdByName(folderName)
    if(!folderId) return []
    const mFilters = {
        ...filters,
        'metadata.folderId': folderId
    }
    const files = await FlashesBucket.find(mFilters).toArray()
    return files.map(f => {
        const { folderId, sortOrder, attributes, microType, microModel, vehicle } = f.metadata
        return {
            id: f._id,
            folder: folderName,
            name: f.filename,
            sortOrder: sortOrder,
            attributes,
            metadata: includeMetadata ? { microType, microModel, vehicle } : undefined
        }
    })
}

/**
 * @param {{ folderName: string, fileName: string, inputStream: import('stream').Stream, metadata?: Record<string, any> }} payload 
 * @returns {Promise<{ id: ObjectId, folder: string, name: string }>}
 */
function uploadFlashFile(payload){
    return new Promise(async (resolve, reject) => {
        const { folderName, fileName, inputStream, metadata } = payload
        const folderId = await EnsureFolderByName(folderName)
        const upStream = FlashesBucket.openUploadStream(fileName, {
            metadata: {
                ...metadata,
                folderId: folderId
            }
        })
        upStream.on('finish', () => resolve({
            id: upStream.id,
            folder: folderName,
            name: fileName,
            metadata
        }))
        upStream.on('error', reject)
        inputStream.pipe(upStream)
    })
}

async function deleteFlashFile(folderName, fileId){
    const folderId = await GetFolderIdByName(folderName)
    const fileDoc = await FlashesCollection.findOne({
        _id: ObjectId(fileId),
        'metadata.folderId': folderId
    })
    if(fileDoc){
        await FlashesBucket.delete(ObjectId(fileDoc._id))
    }
}

/**
 * @param {string} folderName 
 * @returns {Promise<string>}
 */
async function GetFolderIdByName(folderName){
    const folderDoc = await FoldersCollection.findOne({ name: folderName })
    return (folderDoc && folderDoc._id.toString()) || null
}

/**
 * @param {string} folderName 
 * @param {string} folderType 
 * @returns {Promise<string>}
 */
async function EnsureFolderByName(folderName, folderType){
    const folderDoc = await FoldersCollection.findOne({ name: folderName })
    if(folderDoc){
        return folderDoc._id.toString()
    }else{
        const result = await FoldersCollection.insertOne({
            name: folderName,
            type: folderType
        })
        return result.insertedId.toString()
    }
} 

function sanitizeFolderName(raw){
    return raw.replace(/\./g, '-')
            .replace(/\s/g, '_')
}

module.exports = {
    FilterTunesForCustomer,
    getFlashes,
    getSpecialFile,
    sanitizeFolderName,
    uploadFlashFile,
    deleteFlashFile,
    GetFolderIdByName,
    FirmwareDB,
    FlashesBucket,
    FlashesCollection,
    FoldersCollection,
    FlashFolderType,
    EnsureFolderByName
}