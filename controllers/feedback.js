const users = require('../db').coll('comport', 'users')
const { validateStrings } = require('../utils')
const FlashingHistoryService = require('../services/flashingHistory')
const { IsValidString } = require('../jsutils')
const { SetCustomerFlag, CustomerFlags, CUSTOMER_STATUS } = require('../services/customers')

module.exports.flashV2 = async (req, res) => {
    const { email, vin, actualVin, flashName, flashResult, moduleName } = req.body
    if(!validateStrings(email, vin)){
        res.status(400).send('Invalid input data')
        return
    }
    const profile = await users.findOne({ email, vin, status: CUSTOMER_STATUS.Active })
    if(typeof profile === 'object' && profile !== null){
        const last_flashing = {
            tune_name: flashName,
            result: flashResult,
            date: new Date().toISOString()
        }
        const validModuleNames = ['ecu', 'tcu', 'cpc']
        if(validModuleNames.indexOf(moduleName) < 0){
            res.status(400)
            res.json({ error: 'invalid_input', message: 'invalid module name' })
            return
        }
        await users.updateOne({ _id: profile._id }, {
            $set: {
                ['last_flashing_' + moduleName]: last_flashing
            },
            $inc: {
                flash_count: 1
            }
        })

        const flags = await compareVins(profile._id, vin, actualVin)

        await addToFlashingHistory(profile, req.body, { flags })

        res.json({  })
    }else{
        res.json({ error: 'not_found' })
    }
}

module.exports.flash = async (req, res) => {
    const { email, vin, flashName, flashResult } = req.body
    if(!validateStrings(email, vin)){
        res.status(400).send('Invalid input data')
        return
    }
    const profile = await users.findOne({ email, vin })
    if(typeof profile === 'object' && profile !== null){
        const last_flashing = {
            tune_name: flashName,
            result: flashResult,
            date: new Date().toISOString()
        }
        await users.updateOne({ _id: profile._id }, {
            $set: {
                last_flashing_ecu: last_flashing
                // last_tune_flashed: flashName,
                // last_tune_flash_result: flashResult,
                // last_tune_flashed_on: new  Date().toISOString(),
            },
            $inc: {
                flash_count: 1
            }
        })
        await addToFlashingHistory(profile, { ...req.body, moduleName: 'ecu' })
        res.json({  })
    }else{
        res.json({ error: 'not_found' })
    }
}

async function addToFlashingHistory(customer, bodyData, extraData){
    const { flashName, flashResult, moduleName } = bodyData
    await FlashingHistoryService.AddFlashingItem(customer._id, {
        app_name: 'flasher',
        micro_type: moduleName,
        micro_model: (customer[moduleName] || '').trim(),
        tune_name: flashName,
        result_status: flashResult,
        date: new Date(),
        ...extraData
    })
}

async function compareVins(customerId, profileVin, actualVin){
    if(!IsValidString(actualVin)) return;
    if(profileVin.trim() !== actualVin.trim()){
        // Vin mismatch
        await SetCustomerFlag(customerId, CustomerFlags.POSTFLASH_VIN_MISMATCH, true)
        return {
            [CustomerFlags.POSTFLASH_VIN_MISMATCH]: true
        }
    }
    return null
}