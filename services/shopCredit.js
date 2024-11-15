const { ObjectId } = require("mongodb")
const { coll } = require("../db")
const { contains } = require("../helpers/text-kelpers")

const PRODUCT_NAMES = [
    'SHOP CREDIT',
    'TUNER CREDIT',
    'SHOP CREDITS',
    'TUNER CREDITS',
    'LICENSE',
]

module.exports = class ShopCredit{

    static async addFromOrderData(orderData){
        const shopsCollection = coll('comport', 'shops')
        const { shopEmail, creditAmount } = this._getCreditAdditionData(orderData)
        const shop = await shopsCollection.findOne({
            email: shopEmail
        })
        if(!shop){
            throw new Error('Shop not found')
        }
        await shopsCollection.updateOne(
            {
                _id: ObjectId(shop._id)
            },
            {
                $inc: {
                    credit: creditAmount
                }
            }
        )
    }

    static _getCreditAdditionData(data){
        const shopEmail = data.billing.email
        let creditAmount = 0
        let found = false
        for(let line of data.line_items){
            if(contains(line.name, PRODUCT_NAMES)){
                found = true
                creditAmount = Math.floor(parseFloat(line.subtotal))
                break
            }
        }
        if(!found){
            throw new Error('Could not find credit item.')
        }
        return {
            shopEmail,
            creditAmount
        }
    }

}