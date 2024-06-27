const KvsService = require('./kvs')

const KVS_GROUP_NAME = 'microcontrollers'

module.exports = class MicrosListService{

    /**
     * @typedef {{key: string, name: string}} MicrocontrollerItem
     */

    /**
     * @returns {Promise<MicrocontrollerItem[]>}
     */
    static async GetAll(){
        const items = await KvsService.GetAllGroupValues(KVS_GROUP_NAME)
        return items.map(({ key, value }) => ({ key, name: value }))
    }

    /**
     * @param {string} name 
     * @returns {Promise<MicrocontrollerItem>}
     */
    static async Add(name){
        const value = name.trim()
        const key = value.toLowerCase().replace(/\s/g, '_')
        await KvsService.SetValue(KVS_GROUP_NAME, key, value)
        return {
            key,
            name: value
        }
    }

    /**
     * @param {string} key 
     * @returns {Promise<void>}
     */
    static async Remove(key){
        await KvsService.DeleteValue(KVS_GROUP_NAME, key)
    }

}