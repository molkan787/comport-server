const NoPermissionError = require("../../framework/errors/NoPermissionError")
const { WrapRouteHandler } = require("../../helpers/controller-helpers")
const AutoCustomerCreator = require("../../services/auto-customer-creator")

const AUTH_SECRET = 'test_secret_xxxxxxxxxxxxxxxxxxxxxx'

module.exports = {
    createCustomer(req, res){
        return WrapRouteHandler(req, res, null, async () => {

            if(req.headers.secret !== AUTH_SECRET){
                throw new NoPermissionError('Authentication Failed.')
            }

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
            
            if(req.headers.secret !== AUTH_SECRET){
                throw new NoPermissionError('Authentication Failed.')
            }

            const orderData = req.body
            if(orderData.status === '---'){
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