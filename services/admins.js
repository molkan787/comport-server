const { coll } = require('../db')
const admisColl = coll('comport', 'admins')

module.exports = class AdminsService{

    static async AuthenticateAdmin(authToken){
        if(typeof authToken !== 'string' || authToken.length < 1){
            return null
        }
        const adminUser = await admisColl.findOne({ auth_token: authToken })
        return adminUser || null
    }

}