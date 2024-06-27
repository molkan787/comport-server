const md5 = require('md5')

const btoa = (str) => Buffer.from(str).toString('base64')
const atob = (base64) => Buffer.from(base64, 'base64').toString()

module.exports.create = function ({ subject, payload, expireIn, key }){
    const expireAt = expireIn ? (timestamp() + expireIn) : undefined;
    const data = {
        subject,
        payload,
        expireAt
    }
    const dataStr = JSON.stringify(data)
    const hash = md5(`${key}${dataStr}${key}`)
    const rawToken = `${hash}:${dataStr}`
    const token = btoa(rawToken)
    return token
}

module.exports.decode = function(token, key){
    const rawToken = atob(token)
    const userHash = rawToken.substr(0, 32)
    const dataStr = rawToken.substr(33)
    const hash = md5(`${key}${dataStr}${key}`)
    if(userHash !== hash){
        throw new JwtError("Verification failed")
    }
    const data = JSON.parse(dataStr)
    if(typeof expireAt == 'number'){
        if(timestamp() > expireAt){
            throw new JwtError("Token has expired")
        }
    }
    const { subject, payload } = data
    return { subject, payload }
}

class JwtError extends Error{
    get isJwtError(){
        return true;
    }
}

function timestamp(){
    return Math.floor(new Date().getTime() / 1000)
}