const { GridFSBucket, ObjectId } = require('mongodb')
const { client } = require('../db')
const { FoldersCollection, FlashFolderType, GetFolderIdByName, FlashesBucket } = require('../services/tunes')

async function run(){
    await client.connect()
    const legacyFirmwareDB = client.db('firmwares')
    const collections = await legacyFirmwareDB.collections()

    await Promise.all(
        collections.map(c => c.drop())
    )

    // const folders = collections.map(c => c.namespace)
    //                 .filter(n => n.endsWith('.files'))
    //                 .map(n => n.substring(10, n.length - 6))
    // // console.log(folders)

    // const docs = folders.map(f => ({
    //     name: f,
    //     type: (
    //         f.startsWith('SHOP_') ? FlashFolderType.Shop : (
    //             f.includes('@') ? FlashFolderType.CustomerCustom : FlashFolderType.Global
    //         )
    //     )
    // }))

    // console.log(docs)

    // await FoldersCollection.insertMany(docs)

    const folders = await FoldersCollection.find().toArray()
    console.log(`Found ${folders.length} folder`)

    for(let folder of folders){
        console.log(`[ Migrating ${folder.name} ]`)
        const fcoll = legacyFirmwareDB.collection(`${folder.name}.files`)
        const bucket = new GridFSBucket(legacyFirmwareDB, { bucketName: folder.name })
        const files = await fcoll.find().toArray()
        for(let file of files){
            console.log(`  > Moving fike '${file.filename}'`)
            const readStream = bucket.openDownloadStream(ObjectId(file._id))
            const writeStream = FlashesBucket.openUploadStream(
                file.filename,
                {
                    metadata: {
                        ...file.metadata,
                        sortOrder: file.sortOrder || 0,
                        folderId: folder._id.toString()
                    }
                }
            )
            readStream.pipe(writeStream)
            await new Promise((resolve, reject) => {
                writeStream.on('finish', resolve)
                writeStream.on('error', reject)
            })
        }
    }

    // await FoldersCollection.insertOne({
    //     name: '20005000',
    //     type: FlashFolderType.Global
    // })
    // const folderId = await GetFolderIdByName('20005000')
    // console.log('folderId', folderId)
    
}

run()
.then(() => console.log('Task Completed!'))
.catch(err => console.error(err))
.finally(() => process.exit())