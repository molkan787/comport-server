const { ObjectId } = require('mongodb')
const MemoryStream = require('memorystream');
const { coll } = require('../db')
const NoPermissionError = require('../framework/errors/NoPermissionError')
const { IsValidString, StreamToBuffer, IsValidObject } = require('../jsutils')
const { arrayToMap } = require('../utils')
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

    static HasShopAccessToMicros(shopData, micros){
        const { ecus, tcus, cpcs } = shopData.allowed_modules || {}
        const { ecu, tcu, cpc } = micros
        return (
            (IsValidString(ecu) ? ecus.includes(ecu) : true) &&
            (IsValidString(tcu) ? tcus.includes(tcu) : true) &&
            (IsValidString(cpc) ? cpcs.includes(cpc) : true)
        )
    }

    // TODO: create a shared function that checks all the permissions (share between UpdateShopCustomer() & CreateShopCustomer())

    static async UpdateShopCustomer(shopId, customerId, update){
        const hasAccess = await this.HasShopAccessToCustomer(shopId, customerId)
        if(!hasAccess) throw new NoPermissionError('Shop does not have access to the specified customer')
        const shopData = await shopsCollection.findOne({ _id: ObjectId(shopId) })
        let { ecu, tcu, cpc, vehicle } = update
        ecu = IsValidString(ecu) ? ecu : ''
        tcu = IsValidString(tcu) ? tcu : ''
        cpc = IsValidString(cpc) ? cpc : ''
        vehicle = IsValidString(vehicle) ? vehicle : ''
        const micros = { ecu, tcu, cpc }
        if(IsValidString(vehicle)){
            this._ValidateShopAccessToVehicle(shopData, vehicle)
            await this._PutVehicleMicros(micros, vehicle)
        }else{
            const hasAccessToMicros = this.HasShopAccessToMicros(shopData, micros)
            if(!hasAccessToMicros) throw new NoPermissionError('Shop does not have access to the specified module(s)')
        }
        await Promise.all([
            customersCollection.updateOne(
                { _id: ObjectId(customerId) },
                {
                    $set: { ...micros, vehicle }
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
        let { ecu, tcu, cpc, vehicle } = customerData
        ecu = IsValidString(ecu) ? ecu : ''
        tcu = IsValidString(tcu) ? tcu : ''
        cpc = IsValidString(cpc) ? cpc : ''
        vehicle = IsValidString(vehicle) ? vehicle : ''
        const micros = { ecu, tcu, cpc }
        const shopData = await this._GetShopData(shopId)
        if(IsValidString(vehicle)){
            this._ValidateShopAccessToVehicle(shopData, vehicle)
            await this._PutVehicleMicros(micros, vehicle)
        }else{
            const hasAccessToMicros = this.HasShopAccessToMicros(shopData, micros)
            if(!hasAccessToMicros) throw new NoPermissionError('Shop does not have access to the specified module(s)')
        }
        const result = await customersCollection.insertOne({
            ...micros, email, vin, vehicle,
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

    static _ValidateShopAccessToVehicle(shopData, vehicleSlug){
        const { allowed_vehicle } = shopData
        if(!Array.isArray(allowed_vehicle) || allowed_vehicle.indexOf(vehicleSlug) == -1){
            throw new NoPermissionError('Current User does not have Access Rights to the selected Vehicle')
        }
    }

    /**
     * 
     * @param {{ ecu: string, tcu: string, cpc: string }} container 
     * @param {string} vehicleSlug 
     */
    static async _PutVehicleMicros(container, vehicleSlug){
        const vehicle = await vehiclesCollection.findOne({ slug: vehicleSlug })
        const m = vehicle.modules || {}
        container.ecu = m.ecu || ''
        container.tcu = m.tcu || ''
        container.cpc = m.cpc || ''
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
            { projection: { _id: 1, allowed_modules: 1 } }
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

    static async GetShopAllowedVehicles(shopId){
        const shopDoc = await shopsCollection.findOne({ _id: ObjectId(shopId) })
        if(shopDoc && Array.isArray(shopDoc.allowed_vehicle) && shopDoc.allowed_vehicle.length > 0){
            const docs = await vehiclesCollection.find({ slug: { $in: shopDoc.allowed_vehicle } }).toArray()
            return docs
        }else{
            return []
        }
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