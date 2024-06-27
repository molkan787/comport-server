const users = require('../db').coll('comport', 'users')
const { StreamToBuffer } = require('../jsutils')
const { CUSTOMER_STATUS } = require('../services/customers')
const { ShopService } = require('../services/shop')
const { validateStrings } = require('../utils')

module.exports = async (req, res) => {
    const { email, vin } = req.body
    if(!validateStrings(email, vin)){
        res.status(400).send('Invalid input data')
        return
    }
    const profile = await users.findOne(
        { email, status: { $in: [CUSTOMER_STATUS.Active, CUSTOMER_STATUS.Banned] } },
        {
            projection: {
                status: 1,
                email: 1,
                vin: 1,
                ecu: 1,
                tcu: 1,
                cpc: 1,
                flash_enabled: 1,
                bypass_vin_check: 1,
                ecuInfo: 1,
                tcuInfo: 1,
                cpcInfo: 1,
                load_tcu_tunes: 1,
                load_cpc_tunes: 1,
                last_flashing_ecu: 1,
                last_flashing_tcu: 1,
                last_flashing_cpc: 1,
                cpc_read_identifiers: 1,
                ecu_read_identifiers: 1,
                tcu_read_identifiers: 1,
                admin_mode: 1,
                shopId: 1,
            }
        }
    )
    if(typeof profile === 'object' && profile !== null){
        const { bypass_vin_check, vin: profileVIN, shopId, status } = profile
        if(bypass_vin_check || (vin === profileVIN && vin.length > 0)){
            await users.updateOne({ _id: profile._id }, {
                $set: {
                    last_login: new Date().toISOString()
                },
                $inc: {
                    login_count: 1
                }
            })
            if(status === CUSTOMER_STATUS.Banned){
                res.json({
                    profile: { status: CUSTOMER_STATUS.Banned },
                })
                return
            }
            if(!!shopId){
                const shopLogo = await getShopLogo(shopId)
                res.json({
                    profile,
                    shopLogo
                })
            }else{
                res.json({ profile })
            }
        }else{
            res.json({ error: 'not_found' })
        }
    }else{
        res.json({ error: 'not_found' })
    }
}

async function getShopLogo(shopId){
    const dStream = await ShopService.GetShopLogo(shopId)
    if(dStream){
        const buffer = await StreamToBuffer(dStream)
        const encodedData = buffer.toString('base64')
        return encodedData
    }else{
        return null
    }
}