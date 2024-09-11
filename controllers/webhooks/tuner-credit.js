const { WrapRouteHandler } = require("../../helpers/controller-helpers")
const TunerUserService = require("../../services/tunerUserService")
const { valdiateSignature, shouldSkipRequest } = require("./_shared_funcs")

const ADD_CREDIT_AUTH_SECRET = '`}s[/2SiKPIi~#1dwS%ts=sr^/5M [DgySmwi|IPa'

module.exports = {

    AddTunerCredit(req, res){
        return WrapRouteHandler(req, res, null, async () => {
            if(shouldSkipRequest(req)){
                console.log(`[Webhook.AddTunerCredit]: Skipped Test Request`)
                return '' // returning an empty response with status code 200 (ok)
            }

            valdiateSignature(req, ADD_CREDIT_AUTH_SECRET)

            const orderData = req.body
            if(orderData.status === 'processing'){
                try {
                    await TunerUserService.addCreditFromOrderData(orderData)
                    return { status: 'ok' }
                } catch (error) {
                    console.error(error)
                    console.log(`[Webhook.AddTunerCredit]: CREDIT NOT ADDED - An error occured {Order Id: ${orderData.id}}`)
                }
            }else{
                console.log(`[Webhook.AddTunerCredit]: CREDIT NOT ADDED - Order status is not processing {Order Id: ${orderData.id}}`)
            }
            return { status: 'failed' }

        })
    }

}