const { client } = require('../db')

const db = client.db('definitions')
const blocksDb = client.db('blocks_definitions')

module.exports.getDefinition = async (req, res) => {
    const { calibrationNumber } = req.params
    if(typeof calibrationNumber != 'string' || calibrationNumber.length < 1){
        res.status(401).send('')
        return
    }
    const collection = db.collection(calibrationNumber)
    const definitions = await collection.find().toArray()
    if(definitions.length == 0){
        res.send({
            error: `Definitions for calibration number "${calibrationNumber}" were not found.`
        })
        return
    }
    const blocksCollection = blocksDb.collection(calibrationNumber)
    const blocksInfo = await blocksCollection.find().toArray()
    res.send({
        definitions: definitions,
        blocksInfo: blocksInfo
    })
}