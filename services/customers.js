const { ObjectId } = require('mongodb')
const { coll } = require('../db')
const { validateStrings } = require('../utils')
const customersCollection = coll('comport', 'users')

const CUSTOMER_STATUS = Object.freeze({
    Pending: 'pending',
    Active: 'active',
    Inactive: 'inactive',
    Banned: 'banned'
})

async function GetCustomerIdByEmailVin(email, vin){
    const customer = await GetCustomerByEmailVin(email, vin)
    return ( (customer || {})._id || '' ).toString() || null
}

async function GetCustomerByEmailVin(email, vin){
    const customer = await customersCollection.findOne({ email, vin })
    return customer || null
}

async function GetCustomerById(id){
    const customer = await customersCollection.findOne({ _id: ObjectId(id) })
    return customer || null
}

async function GetCustomers(){
    const result = await customersCollection.find().toArray()
    return result
}

async function AuthenticateCustomerFromQuery(req, res){
    try {
        const { email, vin } = req.query
        if(!validateStrings(email, vin)){
            res.status(401).send('Forbidden')
            return false
        }
        const customer = await GetCustomerByEmailVin(email, vin)
        if(!!customer && customer.status === CUSTOMER_STATUS.Active){
            req.customer = customer
            return true
        }else{
            res.status(401).send('Forbidden')
            return false
        }
    } catch (error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
        return false
    }
}

async function UpdateCustomer(customerId, update){
    return await customersCollection.updateOne({ _id: ObjectId(customerId) }, update)
}

/**
 * 
 * @param {string | ObjectId} customerId 
 * @param {string} flagId 
 * @param {boolean} state 
 */
async function SetCustomerFlag(customerId, flagId, state){
    await customersCollection.updateOne(
        { _id: ObjectId(customerId) },
        {
            $set: {
                [`flags.${flagId}`]: !!state
            }
        }
    )
}

const CustomerFlags = Object.freeze({
    POSTFLASH_VIN_MISMATCH: 'postflash_vin_mismatch'
})

module.exports = {
    GetCustomerByEmailVin,
    GetCustomerIdByEmailVin,
    AuthenticateCustomerFromQuery,
    UpdateCustomer,
    SetCustomerFlag,
    CustomerFlags,
    GetCustomers,
    GetCustomerById,
    CUSTOMER_STATUS
}