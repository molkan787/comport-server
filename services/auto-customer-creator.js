const { ObjectId } = require("mongodb")
const { coll } = require("../db")
const { IsValidString } = require("../jsutils")

const MICROS_MAPPING = [
    { search: "CLA250 C117", microName: "MED40" },
    { search: "C43 W205", microName: "MED177V6LA" },
    { search: "3.0L V6 BITURBO", microName:"MED177V6LA" },
]


module.exports = class AutoCustomerCreator{


    static async createFromOrderData(orderData){
        const customerData = this._craftCustomerData(orderData)
        const customersCollection = coll('comport', 'users')
        await customersCollection.insertOne(customerData)
    }

    static async updateFromOrderData(orderData){
        const customerData = this._craftCustomerData(orderData)
        const customersCollection = coll('comport', 'users')
        const customer = await customersCollection.findOne({
            email: customerData.email,
            vin: customerData.vin,
        })
        if(customer){
            await customersCollection.updateOne(
                {
                    _id: ObjectId(customer._id)
                },
                {
                    $set: {
                        enabled_tunes: customerData.enabled_tunes
                    }
                }
            )
        }else{
            throw new Error('Customer not found')
        }
    }

    static _craftCustomerData(orderData){
        const { line_items, billing } = orderData
        if(line_items.length < 1){
            throw new Error('Line Items are empty')
        }
        const { name, meta_data } = line_items[0]
        const microName = this._getMicroName(name)
        if(!IsValidString(microName)){
            throw new Error("Unable to detect microcontroller name")
        }

        const load_tcu_tunes = name.toUpperCase().includes('MERCEDES-BENZ TCU TUNING')
        const load_cpc_tunes = false //name.toUpperCase().includes('MERCEDES-BENZ CPC UPGRADE')

        const options = this._getOptions(meta_data)

        const customerData = {
            status: "active",
            email: (billing || {}).email || '',
            vin: (options['VIN'] || '').toUpperCase(),
            ecu: microName,
            tcu: '',
            cpc: '',
            flash_enabled: 'yes',
            load_shared_tunes: true,
            load_tcu_tunes: load_tcu_tunes,
            load_cpc_tunes: load_cpc_tunes,
            enabled_tunes: {
                stage_1: (options['CHOOSE TUNE'] || '').startsWith('STAGE 1'),
                stage_2: (options['CHOOSE TUNE'] || '').startsWith('STAGE 2'),
                burble: (options['BURBLE'] || '').startsWith('Yes'),
                octane_91: (options['OCTANE'] || '').startsWith('91'),
                octane_93: (options['OCTANE'] || '').startsWith('93'),
            }
        }

        return customerData
    }

    static _getOptions(metadata){
        const result = {}
        for(let i = 0; i < metadata.length; i++){
            const { key, value } = metadata[i]
            if(!key.startsWith('_WCPA')){
                result[key] = value
            }
        }
        return result
    }


    static _getMicroName(itemName){
        const name = itemName.toLowerCase()
        for(let i = 0; i < MICROS_MAPPING.length; i++){
            const m = MICROS_MAPPING[i]
            if(name.includes(m.search.toLowerCase())){
                return  m.microName
            }
        }
        return null
    }

}