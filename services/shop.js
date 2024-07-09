const { ObjectId } = require('mongodb')
const MemoryStream = require('memorystream');
const { coll } = require('../db')
const NoPermissionError = require('../framework/errors/NoPermissionError')
const { IsValidString, StreamToBuffer, IsValidObject } = require('../jsutils')
const { arrayToMap, numOrDefault } = require('../utils')
const { CUSTOMER_STATUS } = require('./customers')
const GenericEntriesService = require('./genericEntries')
const { getFlashes, sanitizeFolderName, uploadFlashFile, deleteFlashFile } = require('./tunes');
const { Readable } = require('stream');
const NotFoundError = require('../framework/errors/NotFoundError');
const BadRequestError = require('../framework/errors/BadRequestError');

const shopsCollection = coll('comport', 'shops')
const customersCollection = coll('comport', 'users')
const filesAccessCollection = coll('comport', 'customer_shop_files')
const vehiclesCollection = coll('comport', 'vehicles')

const ShopUserType = Object.freeze({
    Reseller: 'reseller',
    AdminTool: 'admin-tool'
})

class ShopService{

    static async GetShopCustomers(shopId){
        const customers = await customersCollection.find(
            { shopId: shopId.toString() },
            {
                projection: {
                    email: 1,
                    vin: 1,
                    ecu: 1,
                    tcu: 1,
                    cpc: 1,
                    vehicle: 1,
                    status: 1
                }
            }
        ).toArray()
        const customersIds = customers.map(c => c._id.toString())
        const filesAccess = await filesAccessCollection.find({
            shopId: shopId.toString(),
            customerId: { $in: customersIds },
        }).toArray()
        this._mergeFileAccessIntoCustomersData(customers, filesAccess)
        return customers
    }

    static _mergeFileAccessIntoCustomersData(customers, filesAccess){
        const cm = arrayToMap(customers, c => c._id, c => c)
        for(let i = 0; i < filesAccess.length; i++){
            const fa = filesAccess[i]
            const customer = cm[fa.customerId]
            if(customer) customer.filesAcccess = fa.filesIds
        }
    }

    static async HasShopAccessToCustomer(shopId, customerId){
        const customer = await customersCollection.findOne(
            { _id: ObjectId(customerId) },
            { projection: { _id: 1, shopId: 1 } }
        )
        const csid = customer && customer.shopId && customer.shopId.toString()
        const _shopId = shopId.toString()
        return csid === _shopId && _shopId.length > 0
    }

    static HasShopAccessToMicros(shopData, micros, vehicleData){
        const { ecus, tcus, cpcs } = shopData.allowed_modules || {}
        const { ecu, tcu, cpc } = micros
        const { modules } = vehicleData || {}
        return (
            ((IsValidString(ecu) ? ecus.includes(ecu) : true) || (modules && modules.ecu === ecu)) &&
            ((IsValidString(tcu) ? tcus.includes(tcu) : true) || (modules && modules.tcu === tcu)) &&
            ((IsValidString(cpc) ? cpcs.includes(cpc) : true) || (modules && modules.cpc === cpc))
        )
    }

    // TODO: create a shared function that checks all the permissions (share between UpdateShopCustomer() & CreateShopCustomer())

    static async UpdateShopCustomer(shopId, customerId, update){
        const hasAccess = await this.HasShopAccessToCustomer(shopId, customerId)
        if(!hasAccess) throw new NoPermissionError('Shop does not have access to the specified customer')
        const shopData = await shopsCollection.findOne({ _id: ObjectId(shopId) })
        let { ecu, tcu, cpc, vehicle: vehicleSlug } = update
        const micros = { ecu: '', tcu: '', cpc: '' }

        const selected_modules = {
            ecu: '', //IsValidString(ecu) ? ecu : '',
            tcu: IsValidString(tcu) ? tcu : '',
            cpc: IsValidString(cpc) ? cpc : ''
        }

        const vehicleData = await this._GetVehicleData(vehicleSlug)
        if(vehicleData){
            this._ValidateShopAccessToVehicle(shopData, vehicleSlug)
        }

        const hasAccessToMicros = this.HasShopAccessToMicros(shopData, selected_modules, vehicleData)
        if(!hasAccessToMicros){
            throw new NoPermissionError('Shop does not have access to the specified module(s)')
        }

        if(vehicleData){
            await this._PutVehicleMicros(micros, vehicleData)
        }

        // if(IsValidString(ecu)) micros.ecu = ecu
        if(IsValidString(tcu)) micros.tcu = tcu
        if(IsValidString(cpc)) micros.cpc = cpc

        const customer = await customersCollection.findOne({ _id: ObjectId(customerId) })
        const changedMicros = { ecu: '', tcu: '', cpc: '' }
        if(customer.ecu !== micros.ecu) changedMicros.ecu = micros.ecu
        if(customer.tcu !== micros.tcu) changedMicros.tcu = micros.tcu
        if(customer.cpc !== micros.cpc) changedMicros.ecu = micros.cpc

        // Credits check and Consomption
        const microsTotalCost = await this._calculateRequiredCredit(changedMicros)
        const creditResult = await this.consumeCredits(shopId, microsTotalCost)
        if(creditResult !== 'consumed'){
            throw new BadRequestError(`Could not consume shop\'s credit. [${creditResult}]`)
        }

        await Promise.all([
            customersCollection.updateOne(
                { _id: ObjectId(customerId) },
                {
                    $set: { ...micros, vehicle: vehicleSlug }
                }
            ),
            Array.isArray(update.filesAcccess) ? filesAccessCollection.updateOne(
                { shopId: shopId.toString(), customerId: customerId.toString() },
                { $set: { filesIds: update.filesAcccess } },
                { upsert: true }
            ) : Promise.resolve()
        ])
    }

    static async CreateShopCustomer(shopId, customerData){
        const { email, vin, filesAcccess } = customerData
        const shopData = await this._GetShopData(shopId)
        let { ecu, tcu, cpc, vehicle: vehicleSlug } = customerData
        const micros = { ecu: '', tcu: '', cpc: '' }

        const selected_modules = {
            ecu: '', //IsValidString(ecu) ? ecu : '',
            tcu: IsValidString(tcu) ? tcu : '',
            cpc: IsValidString(cpc) ? cpc : ''
        }

        const vehicleData = await this._GetVehicleData(vehicleSlug)
        if(vehicleData){
            this._ValidateShopAccessToVehicle(shopData, vehicleSlug)
        }

        const hasAccessToMicros = this.HasShopAccessToMicros(shopData, selected_modules, vehicleData)
        if(!hasAccessToMicros){
            throw new NoPermissionError('Shop does not have access to the specified module(s)')
        }

        if(vehicleData){
            await this._PutVehicleMicros(micros, vehicleData)
        }

        // if(IsValidString(ecu)) micros.ecu = ecu
        if(IsValidString(tcu)) micros.tcu = tcu
        if(IsValidString(cpc)) micros.cpc = cpc

        
        // Credits check and Consomption
        const microsTotalCost = await this._calculateRequiredCredit(micros)
        const creditResult = await this.consumeCredits(shopId, microsTotalCost)
        if(creditResult !== 'consumed'){
            throw new BadRequestError(`Could not consume shop\'s credit. [${creditResult}]`)
        }

        const result = await customersCollection.insertOne({
            ...micros, email, vin, vehicle: vehicleSlug,
            status: CUSTOMER_STATUS.Pending,
            shopId: shopId.toString()
        })
        const customerId = result.insertedId
        await filesAccessCollection.updateOne(
            { shopId: shopId.toString(), customerId: customerId.toString() },
            { $set: { filesIds: filesAcccess } },
            { upsert: true }
        )
        return { customerId }
    }

    /**
     * @param {{ ecu: string, tcu: string, cpc: string }} micros 
     */
    static async _calculateRequiredCredit(micros){
        const { ecu, tcu, cpc } = micros
        const _list = []
        if(ecu) _list.push(ecu)
        if(tcu) _list.push(tcu)
        if(cpc) _list.push(cpc)
        const docs = await coll('kvs', 'micros_credit_costs').find({
            key: {
                $in: _list
            }
        }).toArray()
        const costs = docs.map(d => parseInt(d.value))
        const totalCost = costs.reduce((t, v) => t + v, 0)
        return totalCost
    }

    static _ValidateShopAccessToVehicle(shopData, vehicleSlug){
        const { allowed_vehicle } = shopData
        if(!Array.isArray(allowed_vehicle) || allowed_vehicle.indexOf(vehicleSlug) == -1){
            throw new NoPermissionError('Current User does not have Access Rights to the selected Vehicle')
        }
    }

    /**
     * @param {string} vehicleSlug 
     */
    static async _GetVehicleData(vehicleSlug){
        const vehicle = await vehiclesCollection.findOne({ slug: vehicleSlug })
        return vehicle
    }

    /**
     * @param {{ ecu: string, tcu: string, cpc: string }} container 
     * @param {Record<string, any>} vehicle 
     */
    static async _PutVehicleMicros(container, vehicle){
        const m = vehicle.modules || {}
        container.ecu = m.ecu || ''
        // container.tcu = m.tcu || ''
        // container.cpc = m.cpc || ''
        return vehicle
    }

    static async GetShopFiles(shopId){
        const folderName = await this._GetShopFolderName(shopId)
        const files = await getFlashes(folderName, { includeMetadata: true })
        return files
    }

    static async UploadShopFile(shopId, inputStream, fileName, microType, vehicle){
        const folderName = await this._GetShopFolderName(shopId)
        const modules = await this._GetShopVehicleModules(shopId, vehicle)
        const microModel = modules[microType]
        if(!IsValidString(microModel)){
            throw new BadRequestError(`${microType} for ${vehicle} were not be found`)
        }
        const fileDoc = await uploadFlashFile({
            folderName: folderName,
            fileName: fileName,
            inputStream: await this.UnpadTuneFile(inputStream),
            metadata: {
                microType,
                microModel,
                vehicle
            }
        })
        return fileDoc
    }

    /**
     * @private
     * @param {import('stream').Readable} inputStream 
     */
    static async UnpadTuneFile(inputStream){
        const alldata = await StreamToBuffer(inputStream)
        if(alldata.length < 102001) return Readable.from(alldata)
        const data = alldata.slice(2000, alldata.length - 100000)
        return Readable.from(data)
    }

    static async DeleteShopFile(shopId, fileId){
        const folderName = await this._GetShopFolderName(shopId)
        await deleteFlashFile(folderName, fileId)
    }

    static async _GetShopFolderName(shopId){
        const shop = await shopsCollection.findOne({ _id: ObjectId(shopId) }, { projection: { email: 1 } })
        if(!shop) return null
        return `SHOP_${sanitizeFolderName(shop.email)}`
    }

    static async _GetShopData(shopId){
        return await shopsCollection.findOne(
            { _id: ObjectId(shopId) },
            { projection: {
                    _id: 1,
                    allowed_modules: 1,
                    allowed_vehicle: 1,
                } 
            }
        )
    }

    static async GetShopAllowedModules(shopId){
        const doc = await shopsCollection.findOne({ _id: ObjectId(shopId) }, { projection: { allowed_modules: 1 } })
        return doc.allowed_modules || ({
            ecus: [],
            tcus: [],
            cpcs: [],
        })
    }

    static async GetShopAllowedVehicles(shopId, populateCosts){
        const shopDoc = await shopsCollection.findOne({ _id: ObjectId(shopId) })
        if(shopDoc && Array.isArray(shopDoc.allowed_vehicle) && shopDoc.allowed_vehicle.length > 0){
            const vehicles = await vehiclesCollection.find({ slug: { $in: shopDoc.allowed_vehicle } }).toArray()
            if(populateCosts){
                await this._populateVehiclesCosts(vehicles)
            }
            return vehicles
        }else{
            return []
        }
    }

    static async _populateVehiclesCosts(vehicles){
        const modulesSet = new Set()
        for(let i = 0; i < vehicles.length; i++){
            const { ecu, tcu, cpc } = vehicles[i].modules || {}
            if(ecu) modulesSet.add(ecu)
            if(tcu) modulesSet.add(tcu)
            if(cpc) modulesSet.add(cpc)
        }
    
        const modulesList = await coll('kvs', 'micros_credit_costs').find(
            {
                key: {
                    $in: Array.from(modulesSet.values())
                }
            }
        ).toArray()

        const modulesCostsMap = new Map()
        for(let i = 0; i < modulesList.length; i++){
            const m = modulesList[i]
            modulesCostsMap.set(m.key, parseInt(m.value))
        }

        for(let i = 0; i < vehicles.length; i++){
            const v = vehicles[i]
            let cost = 0
            const { ecu, tcu, cpc } = v.modules || {}
            cost += (ecu && modulesCostsMap.get(ecu)) || 0
            cost += (tcu && modulesCostsMap.get(tcu)) || 0
            cost += (cpc && modulesCostsMap.get(cpc)) || 0
            v.cost = cost
        }
    }

    static async GetShopPartialData(shopId, props){
        const doc = await shopsCollection.findOne({ _id: ObjectId(shopId) }, { projection: props })
        delete doc._id
        if(props.allowed_modules){
            const { ecus, tcus, cpcs } = doc.allowed_modules
            const modulesList = await coll('kvs', 'micros_credit_costs').find(
                {
                    key: {
                        $in: [].concat(ecus, tcus, cpcs)
                    }
                }
            ).toArray()
            const costs = arrayToMap(modulesList, m => m.key, m => m.value)
            doc.modules_costs = costs
        }
        return doc
    }

    static async _GetShopVehicleModules(shopId, vehicleSlug){
        const shopDoc = await shopsCollection.findOne({ _id: ObjectId(shopId) })
        const { allowed_vehicle } = shopDoc
        if(!Array.isArray(allowed_vehicle) || allowed_vehicle.indexOf(vehicleSlug) === -1){
            throw new NoPermissionError('Current User does not have access rights to the specified vehicle')
        }
        const vehicle = await vehiclesCollection.findOne({ slug: vehicleSlug })
        if(!IsValidObject(vehicle)){
            throw new NotFoundError('Specified vehicle was not found')
        }
        return vehicle.modules
    }

    static async GetCustomerTunes(shopId, customerId){
        const filesAccess = await filesAccessCollection.findOne({
            shopId: shopId.toString(),
            customerId: customerId.toString(),
        })
        if(!filesAccess) return []
        const folderName = await this._GetShopFolderName(shopId)
        const files = await getFlashes(folderName, {
            includeMetadata: true,
            filters: {
                _id: {
                    $in: filesAccess.filesIds.map(id => ObjectId(id))
                }
            }
        })
        return files
    }

    /**
     * @param {string | ObjectId} shopId 
     * @returns {Promise<MemoryStream>}
     */
    static async GetShopLogo(shopId){
        await shopsCollection.findOne(
            { _id: ObjectId(shopId) },
            { projection: { _id: 1, allowed_modules: 1 } }
        )
        const shopDoc = await GenericEntriesService.GetEntry(
            this._groupName,
            { _id: ObjectId(shopId) },
            { __$attachements: 1 }
        )
        const attch = shopDoc && Array.isArray(shopDoc.__$attachements) && shopDoc.__$attachements[0]
        if(attch){
            const bufStream = new MemoryStream()
            await GenericEntriesService.DownloadEntryAttachement(
                this._groupName,
                attch,
                bufStream
            )
            return bufStream
        }else{
            return null
        }
    }

    static async GetShopCredit(shopId){
        const doc = await shopsCollection.findOne({ _id: ObjectId(shopId) }, { projection: { credit: 1 } })
        return numOrDefault(doc.credit, 0)
    }

    /**
     * Removes specified amount of credits from the shop user's credits
     * @param {string} shopId Shop's Id
     * @param {number} amount Amount of credits to consume (the value must be a POSITIVE Number)
     * @returns {'not_enough_credit' | 'consumed'} returns result status
     */
    static async consumeCredits(shopId, amount){
        const dec = -amount
        const doc = await shopsCollection.findOne({ _id: ObjectId(shopId) })
        if(!doc){
            throw new Error('Shop not found')
        }
        const available_credit = doc.credit || 0
        if(available_credit < amount){
            return 'not_enough_credit'
        }
        await shopsCollection.updateOne(
            {
                _id: ObjectId(shopId)
            },
            {
                $inc: {
                    credit: dec
                }
            }
        )
        return 'consumed'
    }

    static _groupName = {
        database: 'comport',
        collection: 'shops'
    }

    static get _PaddingProcessor(){
        return 'SHOP-P2100'
    }

}

module.exports = {
    ShopService,
    ShopUserType
}