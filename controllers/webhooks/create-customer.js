const NoPermissionError = require("../../framework/errors/NoPermissionError")
const { WrapRouteHandler } = require("../../helpers/controller-helpers")
const AutoCustomerCreator = require("../../services/auto-customer-creator")
const crypto = require('crypto')
const { shouldSkipRequest } = require("./_shared_funcs")

const CREATE_AUTH_SECRET = '`}s[/2SiKPIi~#1dwS%ts=sr^/5M [DgySmwi|IPa'
const UPDATE_AUTH_SECRET = '`}s[/2SiKPIi~#1dwS%ts=sr^/5M [DgySmwi|IPa'

module.exports = {
    createCustomer(req, res){
        return WrapRouteHandler(req, res, null, async () => {
            if(shouldSkipRequest(req)){
                console.log(`[Webhook.createCustomer]: Skipped Test Request`)
                return '' // returning an empty response with status code 200 (ok)
            }

            valdiateSignature(req, CREATE_AUTH_SECRET)

            const orderData = req.body
            if(orderData.status === 'processing'){
                try {
                    await AutoCustomerCreator.createFromOrderData(req.body)
                    return { status: 'ok' }
                } catch (error) {
                    console.error(error)
                    console.log(`[Webhook.createCustomer]: ACCOUNT NOT CREATED - An error occured {Order Id: ${orderData.id}}`)
                }
            }else{
                console.log(`[Webhook.createCustomer]: ACCOUNT NOT CREATED - Order status is not processing {Order Id: ${orderData.id}}`)
            }
            return { status: 'failed' }
        })
    },
    updateCustomer(req, res){
        return WrapRouteHandler(req, res, null, async () => {
            if(shouldSkipRequest(req)){
                console.log(`[Webhook.updateCustomer]: Skipped Test Request`)
                return '' // returning an empty response with status code 200 (ok)
            }
            
            valdiateSignature(req, UPDATE_AUTH_SECRET)

            const orderData = req.body
            if(orderData.status === 'processing'){
                try {
                    await AutoCustomerCreator.updateFromOrderData(req.body)
                    return { status: 'ok' }
                } catch (error) {
                    console.error(error)
                    console.log(`[Webhook.updateCustomer]: ACCOUNT NOT UPDATED - An error occured {Order Id: ${orderData.id}}`)
                }
            }else{
                console.log(`[Webhook.updateCustomer]: ACCOUNT NOT UPDATED - Order status is not processing {Order Id: ${orderData.id}}`)
            }
            return { status: 'failed' }
        })
    }
}

function valdiateSignature(req, secret){
    const plainTextData = req.textBody
    const provided_signature = (req.headers['X-WC-Webhook-Signature'] || req.headers['x-wc-webhook-signature'] || '').trim()
    const calculated_signature = crypto.createHmac('sha256', secret).update(plainTextData).digest("base64")
    if(provided_signature !== calculated_signature){
        throw new NoPermissionError('Security Check Failed.')
    }
}