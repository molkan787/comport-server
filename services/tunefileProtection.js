const { privateKey } = require('../config.json')
const jwt = require('../jwt')

module.exports = class TuneFileProtectionService{

    static attachDownloadTickets(tunefilesInfos){
        for(let f of tunefilesInfos){
            f.downloadTicket = this.createDownloadTicket(f)
        }
        return tunefilesInfos
    }

    static createDownloadTicket(tunefileInfo, extraPayload){
        var token = jwt.create({
            subject: tunefileInfo.name,
            payload: {
                ...extraPayload,
                id: tunefileInfo.id,
                folder: tunefileInfo.folder,
            },
            expireIn: 60 * 60 * 2, // download ticket expires in 2 hours
            key: privateKey
        })
        return token
    }

    /**
     * 
     * @param {string} token 
     * @returns {{name: string, id: string, folder: string}}
     */
    static verifyAndDecode(token){
        var { subject, payload } = jwt.decode(token, privateKey)
        return {
            name: subject,
            ...payload
        }
    }

}