const { AuthenticateCustomerFromQuery, UpdateCustomer } = require('../services/customers')
const { IsValidObject } = require('../jsutils')
const { Central } = require('../central')
const { EVENTS } = require('../events')

const DATA_TYPES = [
    'ecu_read_identifiers',
    'cpc_read_identifiers',
    'tcu_read_identifiers'
]

async function ReportData (req, res) {
    let { items, dataType, data } = req.body
    try {
        if(!(await AuthenticateCustomerFromQuery(req, res))) return
        if(!Array.isArray(items)){
            items = [{ dataType, data }]
        }
        await StoreData(req.customer, items)
        res.send({})
        Central.emit(EVENTS.CUSTOMER_DATA_REPORTED, {
            customer: req.customer,
            clientPayload: {
                items
            }
        })
    } catch (error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
    }
}

async function StoreData(customer, items){
    const update = {}
    let count = 0
    for(let item of items){
        const { dataType, data } = item
        const containsData = IsValidObject(data) && Object.entries(data).length > 0
        const isValidDataType = DATA_TYPES.includes(dataType)
        if(isValidDataType && containsData){ // 'containsData' prevent clearing out existing data if new one is empty
            update[dataType] = data
            count++
        }
    }
    if(count > 0){
        await UpdateCustomer(customer._id, {
            $set: update
        })
        Object.assign(customer, update)
    }
}

module.exports = {
    ReportData
}