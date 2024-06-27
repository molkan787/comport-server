const { ObjectId } = require('mongodb')
const { coll } = require('../db')

const dbCollection = coll('comport', 'flashing_history')

module.exports = class FlashingHistoryService{

    /**
     * @typedef FlashingHistoryItem
     * @property {string} app_name
     * @property {string} micro_type
     * @property {string} micro_model
     * @property {string} tune_name
     * @property {string} result_status
     * @property {Date} date
     */


    /**
     * @param {string | ObjectId} customerId
     * @param {FlashingHistoryItem} item 
     * @returns {Promise<void>}
     */
    static async AddFlashingItem(customerId, item){
        await dbCollection.updateOne(
            {
                _id: ObjectId(customerId)
            },
            {
                $push: {
                    items: item
                }
            },
            {
                upsert: true
            }
        )
    }

    /**
     * @param {string | ObjectId} customerId 
     * @returns {Promise<FlashingHistoryItem[]>}
     */
    static async GetFlashingHistory(customerId){
        const doc = await dbCollection.findOne({ _id: ObjectId(customerId) })
        if(doc && Array.isArray(doc.items)){
            return doc.items
        }else{
            return []
        }
    }

}