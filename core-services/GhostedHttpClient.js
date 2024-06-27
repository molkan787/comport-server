const { SettingStore, SettingKeys } = require("./SettingStoreService");
const { RotatingPool } = require('../libs/rotatingPool');
const { Axios } = require("axios");
const { createInstance } = require("../libs/extendedAxios");
const { Central } = require("../central");
const { EVENTS } = require("../events");

class GhostedHttpClient{

    /** @type {RotatingPool<import('./typings/ProxyItemConfig').ProxyConfigItem>} */
    static pool

    /** @type {import('../core-services/typings/ProxyItemConfig').ProxyConfigItem} */
    static currentProxy

    /** @type {Axios} */
    static currentAxiosInstance

    static async Init(){
        this.pool = new RotatingPool({ timeWindow: 1000 * 20 })
        this.pool.on('changed', () => {
            const { currentIndex, lastChangeTime } = this.pool
            if(currentIndex === null || lastChangeTime === null) return
            SettingStore.SetBulkValues([
                { key: SettingKeys.PROXY_CURRENT_INDEX, value: currentIndex },
                { key: SettingKeys.PROXY_LAST_CHANGE_TIME, value: lastChangeTime }
            ])
        })
        const lastChange = await SettingStore.GetValue(SettingKeys.PROXY_LAST_CHANGE_TIME)
        const currentIndex = await SettingStore.GetValue(SettingKeys.PROXY_CURRENT_INDEX)
        this.pool.setup({
            items: proxyItems,
            currentIndex: currentIndex,
            lastChangeTime: lastChange
        })

    }

    static getInstance(){
        const proxy = this.pool.getCurrentItem()
        if(this.currentProxy !== proxy){
            console.log(`Using Proxy '${proxy.host}'`)
            this.currentProxy = proxy
            this.currentAxiosInstance = createInstance({ proxy })
        }
        return this.currentAxiosInstance
    }

}


// TODO: storage and retrieve this list from database
/** @type {import('../core-services/typings/ProxyItemConfig').ProxyConfigItem[]} */
const proxyItems = [
    { host: '64.113.0.30', port: 49155, protocol: 'http', auth: { username: 'automasterno1', password: 'pnm6GYI3RE' } },
    { host: '108.165.219.64', port: 49155, protocol: 'http', auth: { username: 'automasterno1', password: 'pnm6GYI3RE' } },
    { host: '216.185.47.9', port: 49155, protocol: 'http', auth: { username: 'automasterno1', password: 'pnm6GYI3RE' } },
    { host: '181.215.184.122', port: 49155, protocol: 'http', auth: { username: 'automasterno1', password: 'pnm6GYI3RE' } },
    { host: '94.124.161.4', port: 49155, protocol: 'http', auth: { username: 'automasterno1', password: 'pnm6GYI3RE' } },
]

module.exports = {
    GhostedHttpClient
}

Central.on(EVENTS.DATABASE_READY, () => GhostedHttpClient.Init())