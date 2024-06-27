const BinToolsService = require('../services/binTools')
const MicrosListService = require('../services/microsListService')
const { ObjectId } = require("mongodb")
const { client } = require('../db')
const auth = require('../auth')

async function GetInfo(req, res){
    try {
        const microcontrollers = await MicrosListService.GetAll()
        const tools = BinToolsService.GetToolsList()
        res.send({
            microcontrollers,
            tools
        })
    } catch (error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
    }
}

function Login(req, res) {
    const coll = client.db('comport').collection('tuner_users')
    return auth.login(req, res, async (username, pass) => {
        const user = await coll.findOne({ username: username })
        if(!user) return false
        const valid = user.password === pass
        const ipAddr = req.socket.remoteAddress
        if(valid){
            await coll.updateOne(
                { _id: ObjectId(user._id) },
                { $set: {
                    last_login: new Date().toISOString(),
                    last_login_ip: ipAddr
                } }
            )
        }
        return valid;
    })
}

function ProtectRoutes(req, res, next) {
    const coll = client.db('comport').collection('tuner_users')
    return auth.verify(req, res, next, ({ subject }) => coll.findOne({ username: subject }))
}


module.exports = {
    GetInfo,
    Login,
    ProtectRoutes
}