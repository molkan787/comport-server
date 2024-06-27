const { client, coll } = require('../db')
const { IsValidObject } = require('../jsutils')

const db = client.db('kvs')

module.exports = class KvsService{

    /**
     * @param {string} groupName 
     * @param {string} key 
     * @param {string} value 
     */
    static async SetValue(groupName, key, value){
        const collection = db.collection(groupName)
        await collection.updateOne(
            {
                key: key
            },
            {
                $set: {
                    key: key,
                    value: value
                }
            },
            {
                upsert: true
            }
        )
    }

    /**
     * @param {string} groupName 
     * @param {string} key 
     * @returns {Promise<void>}
     */
    static async DeleteValue(groupName, key){
        const collection = db.collection(groupName)
        await collection.deleteOne({ key })
    }

    /**
     * @param {string} groupName 
     * @returns {Promise<void>}
     */
    static async DeleteAllGroupValues(groupName){
        const collection = db.collection(groupName)
        await collection.deleteMany({})
    }

    /**
     * 
     * @param {string} groupName 
     * @param {string} key 
     * @returns {Promise<any>
     */
    static async GetValue(groupName, key){
        const collection = db.collection(groupName)
        const doc = await collection.findOne({ key: key })
        if(IsValidObject(doc)){
            return doc.value || null
        }else{
            return null
        }
    }

    /**
     * @param {string} group 
     * @param {string} key 
     * @returns {Promise<{group: string, key: string, value: any} | null>}
     */
     static async GetItem(group, key){
        const value = await this.GetValue(group, key);
        if(!value) return null;
        return {
            group,
            key,
            value
        }
    }

    /**
     * Fetch all key-value items of the specified group
     * @param {string} groupName 
     * @returns {Promise<{key: string, value: string}[]>}
     */
    static async GetAllGroupValues(groupName){
        const collection = db.collection(groupName)
        const docs = await collection.find().toArray()
        const items = docs.map(({ key, value }) => ({ key, value }))
        return items
    }

    /**
     * Replace all key-values items of the specified group
     * @param {string} groupName Values group name
     * @param {{key: string, value: string}[]} items New items to store in the group
     * @returns {Promise<void>}
     */
    static async PutGroupValues(groupName, items){
        const collection = db.collection(groupName)
        const keys = items.map(item => item.key)
        await collection.deleteMany({
            key: {
                $nin: keys
            }
        })
        const queries = items.map(({ key, value }) => collection.updateOne(
            { key: key },
            { $set: { key, value } },
            { upsert: true }
        ))
        await Promise.all(queries)
    }

}