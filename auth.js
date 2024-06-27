const { privateKey } = require('./config.json')
const { ValidateStringParams } = require('./helpers/inputValidation')
const { IsValidObject } = require('./jsutils')
const jwt = require('./jwt')

/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {(user: string, pass: string) => Promise<boolean | { valid: boolean, payload?: any }>} check 
 */
module.exports.login = async function (req, res, check){
    try {
        const { user, pass } = req.body
        if(!ValidateStringParams(res, { user, pass }, false)) return
        const result = await check(user, pass)
        let validLogin = false
        let payload = undefined
        let responsePayload = undefined
        if(typeof result == 'boolean'){
            validLogin = result
        }else{
            validLogin = !!(result.valid)
            payload = result.payload || undefined
            responsePayload = result.responsePayload || undefined
        }
        if(validLogin){
            const token = jwt.create({
                subject: user,
                expireIn: 60 * 60 * 24 * 5, // 5 days
                key: privateKey,
                payload: payload
            })
            res.send({
                ...responsePayload,
                token: token
            })
        }else{
            res.send({
                error: 'invalid_login',
                errorMessage: "Invalid login credentials"
            })
        }
    } catch (error) {
        if(error.isAuthError){
            res.send({
                error: error.errorCode,
                errorMessage: error.message
            })
        }else{
            console.error(error)
            res.status(500).send({
                error: 'internal_server_error',
                errorMessage: 'Internal Server Error'
            })
        }
    }
}

/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {() => void} next 
 * @param {({ subject: string, payload: any }) => Promise<any>} getUser 
 * @returns 
 */
module.exports.verify = async function (req, res, next, getUser){
    if(req.method === 'OPTIONS'){
        next();
        return;
    }
    const { authorization } = req.headers
    if(authorization == null || authorization == undefined || authorization.length < 12){
        res.status(401).send("unauthorized")
        return
    }
    const token = authorization.split(' ')[1].trim()
    try {
        const data = jwt.decode(token, privateKey)
        const user = await getUser(data)
        if(user){
            req.user = user
            next()
        }else{
            res.status(401).send('User does not exist.')
        }
    } catch (error) {
        res.status(401).send(error.message)
    }
}
