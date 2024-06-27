const InvalidInputError = require("../framework/errors/InvalidInputError")
const { AuthenticateCustomerFromQuery } = require("../services/customers")
const UserLogsService = require("../services/userlogs")
const { WrapRouteHandler } = require('../helpers/controller-helpers')
const { ValidateParams } = require('../helpers/inputValidation')

async function AddLogs(req, res){
    if(!(await AuthenticateCustomerFromQuery(req, res))) return
    try {
        const body = req.body
        let { logs } = body
        if(typeof body === 'string' && body.length > 0){
            logs = body.split('\n')
        }
        if(!Array.isArray(logs))
            throw new InvalidInputError('Missing or invalid input `logs`')
        await UserLogsService.AddLogs(req.customer._id.toString(), logs)
        res.send({})
    } catch (error) {
        if(InvalidInputError.ItIs(error)){
            res.status(400).send(error.message)
        }else{
            console.error(error)
            res.status(500).send('interval server error')
        }
    }
}

async function GetLogs(req, res){
    const { userId } = req.params
    const { count: countRaw, after } = req.query
    try {
        const count = (typeof countRaw == 'string' && countRaw.length > 0) ? parseInt(countRaw) : 1
        const { items, lastGroupKey } = await UserLogsService.GetLogs(userId, count, after)
        const header = JSON.stringify({ lastGroupKey })
        items.push(header)
        const response = items.join('\n')
        // res.setHeader('Content-Type', 'text/plain')
        res.type('txt')
        res.send(response)
    } catch (error) {
        console.error(error)
        res.status(500).send('internal server error')
    }

}

async function ClearLogs(req, res){
    return WrapRouteHandler(
        req, res, () => ValidateParams(res, { userId: req.params.userId }),
        () => UserLogsService.ClearLogs(req.params.userId)
    )
}

module.exports = {
    AddLogs,
    GetLogs,
    ClearLogs
}