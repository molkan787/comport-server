const { WrapRouteHandler } = require("../../helpers/controller-helpers")
const ShopCredit = require("../../services/shopCredit")
const { valdiateSignature, shouldSkipRequest } = require("./_shared_funcs")

const ADD_CREDIT_AUTH_SECRET = '`}s[/2SiKPIi~#1dwS%ts=sr^/5M [DgySmwi|IPa'

module.exports = {

    AddShopCredit(req, res){
        return WrapRouteHandler(req, res, null, async () => {
            if(shouldSkipRequest(req)){
                console.log(`[Webhook.AddShopCredit]: Skipped Test Request`)
                return '' // returning an empty response with status code 200 (ok)
            }

            // valdiateSignature(req, ADD_CREDIT_AUTH_SECRET)

            const orderData = req.body
            if(orderData.status === 'processing'){
                try {
                    await ShopCredit.addFromOrderData(req.body)
                    return { status: 'ok' }
                } catch (error) {
                    console.error(error)
                    console.log(`[Webhook.AddShopCredit]: CREDIT NOT ADDED - An error occured {Order Id: ${orderData.id}}`)
                }
            }else{
                console.log(`[Webhook.AddShopCredit]: CREDIT NOT ADDED - Order status is not processing {Order Id: ${orderData.id}}`)
            }
            return { status: 'failed' }

        })
    }

}