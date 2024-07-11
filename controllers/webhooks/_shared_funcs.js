const NoPermissionError = require("../../framework/errors/NoPermissionError")
const crypto = require('crypto')
const { IsValidObject } = require("../../jsutils")

module.exports = {
    valdiateSignature(req, secret){
        const plainTextData = req.textBody
        const provided_signature = (req.headers['X-WC-Webhook-Signature'] || req.headers['x-wc-webhook-signature'] || '').trim()
        const calculated_signature = crypto.createHmac('sha256', secret).update(plainTextData).digest("base64")
        if(provided_signature !== calculated_signature){
            throw new NoPermissionError('Security Check Failed.')
        }
    },
    shouldSkipRequest(req){
        const contentType = req.headers['Content-Type'] || req.headers['content-type'] || ''
        return contentType !== 'application/json' || !IsValidObject(req.body)
    }
}