const { GridFSBucket, ObjectId } = require("mongodb")
const { client, coll } = require('../db')
const TuneFileProtectionService = require('../services/tunefileProtection')
const { FilterTunesForCustomer } = require("../services/tunes")
const { numOrDefault } = require('../utils')
const { getFlashes, getSpecialFile } = require('../services/tunes')
const { IsValidString } = require("../jsutils")
const { CUSTOMER_STATUS } = require("../services/customers")
const { ShopService } = require("../services/shop")

const customersCollection = coll('comport', 'users')
const flashesSorter = (a, b) => numOrDefault(a.sortOrder, 100000) - numOrDefault(b.sortOrder, 100000)

async function listFlashes(req, res) {
    try {
        const { software_number, email, vin } = req.params
        const { software_numbers } = req.query
        const customer = await customersCollection.findOne(
            { email, vin },
            { 
                projection: {
                    status: 1,
                    shopId: 1,
                    load_shared_tunes: 1,
                    load_tcu_tunes: 1,
                    load_cpc_tunes: 1,
                    last_flashing_cpc: 1,
                    last_flashing_ecu: 1,
                    last_flashing_tcu: 1,
                    enabled_tunes: 1,
                }
            }
        )
        if(!customer || customer.status !== CUSTOMER_STATUS.Active){
            res.status(401).send('Customer not found')
            return
        }

        const belongsToShop = IsValidString(customer.shopId)
        
        // updating info like ecuInfo... of the customer
        await logInfos(customer._id, req)

        let tunes = []

        if(belongsToShop){
            tunes = await ShopService.GetCustomerTunes(customer.shopId, customer._id)
        }else{
            const { load_shared_tunes: loadSharedFlashes } = customer
            const customFolder = vin.toUpperCase() + email.toLowerCase().split('.')[0]
            let generalTunes = []
            if(loadSharedFlashes){
                if(typeof software_numbers == 'string'){
                    const softNums = software_numbers.split(',')
                    const queries = softNums.map(sn => getFlashes(sn))
                    const tunesArrays = await Promise.all(queries)
                    generalTunes = [].concat.apply([], tunesArrays.map(arr => arr.sort(flashesSorter)));
                }else{
                    generalTunes = await getFlashes(software_number)
                    generalTunes.sort(flashesSorter)
                }
            }
            const customTunes = await getFlashes(customFolder)
            tunes = [
                ...generalTunes,
                ...customTunes.sort(flashesSorter)
            ]
            tunes = FilterTunesForCustomer(tunes, customer)
        }

        const { last_flashing_cpc, last_flashing_ecu, last_flashing_tcu } = customer

        res.json({
            tunes: TuneFileProtectionService.attachDownloadTickets(tunes),
            customerInfo: {
                last_flashing_cpc,
                last_flashing_ecu,
                last_flashing_tcu
            }
        })
    } catch (error) {
	    console.error(error)
        res.json({
            error: 'unknow_error'
        })
    }
}

async function getSpecialFileRoute(req, res){
    try {
        const _file = await getSpecialFile(req.query)
        const file = !!_file ? TuneFileProtectionService.attachDownloadTickets([_file])[0] : null
        res.send({
            file: file
        })
    } catch (error) {
        console.error(error)
        res.status(500)
        res.send()
    }
}

async function logInfos(customerId, request){
    const { info: infoRaw } = request.query || {}
    const { software_number } = request.params
    let info = {}
    try {
        info = JSON.parse(infoRaw)
    } catch (error) { }
    const validKeys = ['ecuInfo', 'tcuInfo', 'cpcInfo', 'cpc', 'tcu']
    const update = (
        typeof software_number == 'string' && software_number.trim().length > 0 ?
        {
            // if the `info` does not include ecuInfo at least use for it `software_number` from params
            ecuInfo: software_number
        } :
        {}
    )
    validKeys.forEach(k => {
        const value = info[k]
        if(typeof value == 'string' && value.trim().length > 0)
            update[k] = value
    })
    await customersCollection.updateOne(
        { _id: ObjectId(customerId) },
        { $set: update }
    )
    const { cvn } = info
    if(IsValidString(cvn)){
        await customersCollection.updateOne(
            { _id: ObjectId(customerId), 'otherInfo.cvn': { $exists: false } },
            { $set: { 'otherInfo.cvn': cvn.trim() } }
        )
    }
}

module.exports = {
    listFlashes,
    getSpecialFileRoute
}
