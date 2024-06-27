const { GhostedHttpClient } = require('../../core-services/GhostedHttpClient')
const { SettingStore, SettingKeys: SettingNames } = require("../../core-services/SettingStoreService");

class OBDLabsService{

    static get axios(){
        return GhostedHttpClient.getInstance()
    }

    /**
     * @typedef {Object} CalculateSwitchOverOptions
     * @property {string} deviceType
     * @property {string} serialNumber
     * 
     * @param {CalculateSwitchOverOptions} options 
     * @returns {Promise<string>}
     */
    static async CalculateSwitchOver(options){
        // return null // temporary disabling this
        await this.tryPrepareAuthAccess()
        
        const { data: { switchOver } } = await this.axios.post(this._url('calculate-switch-over'), {
            deviceType: options.deviceType,
            serialNumber: options.serialNumber
        }, {
            headers: {
                'x-portal-secret': this.portalSecret
            }
        })
        return switchOver
    }

    /**
     * @private
     * @returns {Promise<void>}
     */
    static async tryPrepareAuthAccess(){
        const loginInfo = await SettingStore.GetValue(SettingNames.OBDLAB_LOGIN_INFO)
        await this.prepareAuthAccess(loginInfo)
    }

    /**
     * @private
     * @param {LoginInfo} loginInfo 
     * @returns {Promise<void>}
     */
    static async prepareAuthAccess(loginInfo){
        const isAuthenticated = await this.isAuthenticated()
        if(!isAuthenticated){
            await this.login(loginInfo.username, loginInfo.password)
        }
    }

    static async login(username, password){
        await this.axios.post(this._url('login'), {
            email: username,
            password: password,
            redirect: false
        })
    }

    static async isAuthenticated(){
        try {
            const { data } = await this.axios.get(this._url('self'))
            return typeof data.userId === 'number'
        } catch (error) {
            return false
        }
    }


    /**
     * @private
     */
    static get portalSecret(){
        return '983ae502-0c74-4d63-b2d8-0a4c205d1abc'
    }

    /**
     * @private
     */
    static get _baseApiUrl(){
        return 'https://app.obdlabs.net/api/'
        // return 'http://localhost:3000/api/'
    }

    /**
     * @private
     * @param {string} path 
     * @returns {string}
     */
    static _url(path){
        return this._baseApiUrl + path;
    }

}

module.exports = {
    OBDLabsService
}
