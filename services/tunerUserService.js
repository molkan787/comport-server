const { ObjectId } = require("mongodb")
const { coll } = require("../db")

const CREDIT_ITEM_NAME = 'SHOP CREDITS'

module.exports = class TunerUserService{

    static async addCreditFromOrderData(orderData){
        const tunersCollection = coll('comport', 'tuner_users')
        const { tunerEmail, creditAmount } = this._getCreditAdditionData(orderData)
        const shop = await tunersCollection.findOne({
            email: tunerEmail
        })
        if(!shop){
            throw new Error('Tuner not found')
        }
        await tunersCollection.updateOne(
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
        const tunerEmail = data.billing.email
        let creditAmount = 0
        let found = false
        for(let line of data.line_items){
            if(line.name.toUpperCase() === CREDIT_ITEM_NAME){
                found = true
                creditAmount = Math.floor(parseFloat(line.subtotal))
                break
            }
        }
        if(!found){
            throw new Error('Could not find credit item.')
        }
        return {
            tunerEmail,
            creditAmount
        }
    }

}