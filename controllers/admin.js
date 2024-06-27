const { client } = require('../db')
const auth = require('../auth')
const coll = client.db('comport').collection('admins')

module.exports = class AdminController{

    static Login(req, res){
        return auth.login(req, res, async (username, pass) => {
            const user = await coll.findOne({ username: username })
            if(!user) return false
            const valid = user.password === pass
            return valid;
        })
    }
    
    static ProtectRoutes(req, res, next){
        return auth.verify(req, res, next, ({ subject }) => coll.findOne({ username: subject }))
    }

}