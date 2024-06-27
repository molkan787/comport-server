const { WrapRouteHandler } = require("../../helpers/controller-helpers")
const AutoCustomerCreator = require("../../services/auto-customer-creator")


module.exports = {
    createCustomer(req, res){
        return WrapRouteHandler(req, res, null, async () => {
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
    }
}