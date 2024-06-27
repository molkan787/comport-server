const { coll } = require('../db')
const settingsCollection = coll('comport', 'settings')

class SettingStoreService{

    /**
     * @private
     * @readonly
     * @type {Map<string, any>}
     */
    _cache = new Map()

    /**
     * @public
     * @param {string} key 
     */
    async GetValue(key){
        const cachedValue = this._cache.get(key)
        if(typeof cachedValue == 'undefined'){
            const value = await this.GetValueFromDB(key)
            this._cache.set(key, value)
            return value
        }
        return cachedValue
    }

    /**
     * @private
     * @param {string} key 
     */
    async GetValueFromDB(key){
        const doc = await settingsCollection.findOne({ key: key })
        return (doc && doc.value) || null
    }

    /**
     * @public
     * @param {string} key 
     */
    async InvalidateCachedValue(key){
        this._cache.delete(key)
    }

    /**
     * @param {string} key 
     * @param {any} value 
     */
    async SetValue(key, value){
        await settingsCollection.updateOne(
            { key: key },
            {
                $set: {
                    value: value
                }
            },
            { upsert: true }
        )
        this.InvalidateCachedValue(key)
    }

    /**
     * @public
     * @param {{key: string, value: any}[]} pairs 
     */
    async SetBulkValues(pairs){
        return await Promise.all(pairs.map(p => this.SetValue(p.key, p.value)))
    }

}

// TODO: Add cache expiring


const SettingKeys = Object.freeze({
    OBDLAB_LOGIN_INFO: 'obdlab-login-info',
    CARS_MAKES: 'cars_makes',
    PROXY_LAST_CHANGE_TIME: 'proxt_last_change_time',
    PROXY_CURRENT_INDEX: 'proxy_current_index'
})

module.exports = {
    SettingStore: new SettingStoreService(),
    SettingKeys: SettingKeys
}