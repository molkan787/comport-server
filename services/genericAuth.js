const { IsValidObject } = require("../jsutils")
const GenericEntriesService = require("./genericEntries")
const Auth = require("../auth");
const e = require("express");

class GenericAuthService{

    /**
     * @param {string} groupName 
     * @param {{ username: string, password: string }} credential 
     * @param {MakeOptions?} options
     */
    static async login(groupName, credential, options){
        const { userGetter, payloadGetter } = options || {}
        let entity = null
        if(typeof userGetter == 'function'){
            entity = await userGetter(credential.username)
        }else{
            entity = await GenericEntriesService.GetEntry(groupName, {
                username: credential.username
            })
        }
        if(IsValidObject(entity)){
            const correctPassword = entity.password === credential.password
            if(correctPassword){
                const payload = typeof payloadGetter == 'function' ? (await payloadGetter(entity)) : undefined;
                return {
                    valid: true,
                    payload
                }
            }
        }
        return { valid: false }
    }

    /**
     * 
     * @param {string} groupName 
     * @param {string} username 
     * @param {MakeOptions?} options 
     * @returns 
     */
    static async getUser(groupName, username, options){
        if(options && typeof options.userGetter == 'function'){
            return await options.userGetter(username)
        }else{
            return await GenericEntriesService.GetEntry(groupName, { username: username })
        }
    }

}

class GenericAuthRoutesFactory{

    /**
     * @typedef MakeOptions
     * @property {((username: string) => Promise<any>)?} userGetter
     * @property {((user: any) => Promise<any>)?} payloadGetter
     * 
     * @param {string} groupName Generic entities's name
     * @param {MakeOptions?} options
     */
    static make(groupName, options){
        const loginRoute = (req, res) => Auth.login(
            req, res,
            (u, p) => GenericAuthService.login(groupName, { username: u, password: p }, options)
        )
        const protectRoutes = (req, res, next) => Auth.verify(
            req, res, next,
            ({ subject }) => GenericAuthService.getUser(groupName, subject, options)
        )
        return {
            loginRoute,
            protectRoutes
        }
    }

}

module.exports = {
    GenericAuthService,
    GenericAuthRoutesFactory
}