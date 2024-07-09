const { ObjectId } = require("mongodb")
const { client, coll } = require('../db')
const { validateStrings, numOrDefault } = require('../utils')
const { max_files_per_customer, apps } = require('../config.json')
const auth = require('../auth')
const AuthError = require('../AuthError')
const TuneFileProtectionService = require('../services/tunefileProtection')
const { TunesFilesService } = require("../micro-apps/shops/tunes-files")
const { WrapRouteHandler } = require("../helpers/controller-helpers")
const { ValidateParams } = require("../helpers/inputValidation")
const { GetCustomerByEmailVin, GetCustomerById } = require("../services/customers")
const BadRequestError = require("../framework/errors/BadRequestError")
const NotFoundError = require("../framework/errors/NotFoundError")
const { IsValidString, IsValidObject, AreValidStrings } = require("../jsutils")
const { ShopService, ShopUserType } = require("../services/shop")
const { GetFolderIdByName, FlashesCollection, FlashesBucket, EnsureFolderByName, FlashFolderType, uploadFlashFile } = require("../services/tunes")
const NoPermissionError = require("../framework/errors/NoPermissionError")

const accessToCustomerValidator = (req, res) => {
    const { customerId, email, vin } = req.query
    if(IsValidString(customerId)){
        return validateAccessToCustomer(req, res, customerId)
    }else{
        return validateAccessToCustomer(req, res, { email, vin })
    }
}

module.exports.uploadFirmware = (req, res) => WrapRouteHandler(
    // TODO: add check for `max_files_per_customer`
    req, res, [
        () => validateShopUserType(req, res, ShopUserType.AdminTool),
        () => accessToCustomerValidator(req, res),
    ],
    async () => {
        const isAdminTool = req.user.userType === ShopUserType.AdminTool
        const { filename, microType, vehicle } = req.query
        const validInput = isAdminTool ? AreValidStrings(filename) : AreValidStrings(filename, microType, vehicle)
        if(!validInput){
            throw new BadRequestError('One or more of the parameters are either missing or invalid')
        }
        const { email, vin } = req.queryCustomer
        const customFolderName = getCustomFolderName(email, vin)
        const shopId = req.user._id.toString()

        let microModel
        if(!isAdminTool){
            const modules = await ShopService._GetShopVehicleModules(shopId, vehicle)
            microModel = modules[microType]
            if(!IsValidString(microModel)){
                throw new BadRequestError(`${microType} for ${vehicle} were not be found`)
            }
        }

        const result = await uploadFlashFile({
            folderName: customFolderName,
            fileName: req.query.filename || '',
            inputStream: req,
            metadata: {
                shopId,
                microType: (microType || '--').toLowerCase(),
                microModel: (microModel || '--').toUpperCase(),
                vehicle
            }
        })
        return {
            file: result
        }
    }
)

module.exports.getCustomerFiles = (req, res) => WrapRouteHandler(
    req, res, [
        () => validateShopUserType(req, res, ShopUserType.AdminTool),
        () => accessToCustomerValidator(req, res),
    ],
    async () => {
        const { email, vin } = req.queryCustomer
        const customFolderName = getCustomFolderName(email, vin)
        const folderId = await GetFolderIdByName(customFolderName)
        const shopId = req.user._id.toString()
        const docs = await FlashesBucket.find({
            'metadata.folderId': folderId,
            'metadata.shopId': shopId
        }).toArray()
        const files = docs
        .sort((a, b) => numOrDefault((a.metadata || {}).sortOrder, 100000) - numOrDefault((b.metadata || {}).sortOrder, 100000))
        .map(f => {
            const { sortOrder, microType, microModel, vehicle } = f.metadata
            return {
                id: f._id,
                folder: customFolderName,
                name: f.filename,
                sortOrder: sortOrder,
                metadata: { microType, microModel, vehicle }
            }
        })
        res.send({
            files: TuneFileProtectionService.attachDownloadTickets(files),
            totalFiles: docs.length
        })
    }
)

module.exports.deleteCustomerFile = (req, res) => WrapRouteHandler(
    req, res, [
        () => validateShopUserType(req, res, ShopUserType.AdminTool),
        () => validateAccessToCustomer(req, res, req.query.customerId),
    ],
    async () => {
        const { fileId } = req.query
        const { email, vin } = req.queryCustomer
        const customFolderName = getCustomFolderName(email, vin)
        const folderId = await GetFolderIdByName(customFolderName)
        const shopId = req.user._id.toString()
        const doc = await FlashesCollection.findOne({
            '_id': ObjectId(fileId),
            'metadata.folderId': folderId,
            'metadata.shopId': shopId
        })
        if(IsValidObject(doc)){
            await FlashesBucket.delete(ObjectId(doc._id))
        }else{
            throw new NoPermissionError('Access Permission is Missing')
        }
        return {}
    }
)

module.exports.findStockFile = async (req, res) => {
    const { calibrationNumber } = req.query
    if(calibrationNumber.length !== 10){
        res.status(400)
        res.send('Invalid calibration number')
        return
    }
    
    const tuneFile = await TunesFilesService.FindStockFile(calibrationNumber)
    if(tuneFile){
        tuneFile.downloadTicket = TuneFileProtectionService.createDownloadTicket(
            tuneFile, { processor: ShopService._PaddingProcessor }
        )
    }
    res.send({
        stockFile: tuneFile
    })
}

module.exports.getStockFile = async (req, res) => {
    const { calibrationNumber } = req.query
    if(calibrationNumber.length !== 10){
        res.status(400)
        res.send('Invalid calibration number')
        return
    }
    
    const readStream = await TunesFilesService.GetShopStockFile(calibrationNumber)
    if(readStream !== null){
        readStream.pipe(res)
        return
    }

    res.status(404)
    res.send('Stock file with the specified calibration number was not found')
}

module.exports.getStockFileByCustomer = (req, res) => {
    const { customerEmail, customerVin, fileType } = req.query
    return WrapRouteHandler(req, res,
        () => ValidateParams(res,
            { customerEmail, customerVin, fileType },
            { customerEmail: 'NoneEmptyString', customerVin: 'NoneEmptyString', fileType: 'NoneEmptyString' }
        ),
        async () => {
            const stockFileRefNum = await FindStockFileReference(customerEmail, customerVin, fileType)
            const readStream = await TunesFilesService.GetShopStockFile(stockFileRefNum)
            if(readStream){
                readStream.on('end', () => res.end())
                readStream.pipe(res)
            }else{
                console.error(`Stock file not found, ref num "${stockFileRefNum}"`)
                throw new NotFoundError('Stock file not found')
            }
        } 
    )
}

/**
 * @param {string} customerEmail 
 * @param {string} customerVin 
 * @param {string} fileType 
 */
async function FindStockFileReference(customerEmail, customerVin, fileType){
    const customer = await GetCustomerByEmailVin(customerEmail, customerVin)
    if(!customer){
        throw new BadRequestError('Customer not found')
    }
    if(fileType !== 'ecu' && fileType !== 'cpc'){
        throw new BadRequestError('Unknow file type')
    }
    const mInfoKey = fileType === 'ecu' ? 'ecuInfo' : 'cpcInfo'
    let mInfo = customer[mInfoKey]
    if(!IsValidString(mInfoKey)){
        throw new BadRequestError(`Missing '${mInfoKey}' in customer profile`)
    }
    mInfo = mInfo.trim()
    if(mInfo.length === 30){
        return mInfo.substring(20, 30)
    }else{
        return mInfo
    }
}

module.exports.customerExist = async (req, res) => {
    let { email, vin } = req.query
    if(!validateStrings(email, vin)){
        res.status(400).send('Invalid input data')
        return
    }
    if(await validateRequestedCustomer(req, res, email, vin)){
        res.send({
            exist: true
        })
    }
}

function getCustomFolderName(email, vin){
    return vin.toUpperCase() + email.toLowerCase().split('.')[0]
}

const customersCollection = coll('comport', 'users')

/**
 * @param {string} email 
 * @param {string} vin 
 * @returns {Promise<boolean>} Returns `false` if the requested should be aborded
 */
async function validateRequestedCustomer(req, res, email, vin){
    try {
        const shop = req.user
        const customer = await customersCollection.findOne({ email, vin })
        if(!customer){
            res.send({
                exist: false,
                error: 'Customer profile does not exist.'
            })
        }
        // check if requesting shop has access rights to this customer
        else if(customer.shopId.toString() !== shop._id.toString()){
            res.send({
                exist: false,
                error: 'No access rights to this customer'
            })
        }else{
            return true
        }
        return false
    } catch (error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
        return false
    }
}

/**
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {string | {email: string, vin: string}} customer 
 * @returns {Promise<boolean>}
 */
async function validateAccessToCustomer(req, res, customer){
    const shop = req.user
    if(!!customer){
        let customerDoc
        if(IsValidString(customer)){
            customerDoc = await GetCustomerById(customer)
        }else if(IsValidObject(customer)){
            customerDoc = await GetCustomerByEmailVin(customer.email, customer.vin)
        }
        if(IsValidObject(customerDoc) && (customerDoc.shopId === shop._id.toString())){
            req.queryCustomer = customerDoc
            return true
        }
    }
    throw new NoPermissionError('No access rights to this customer')
}

function validateShopUserType(req, res, requiredUserType){
    if(req.user.userType !== requiredUserType){
        throw new NoPermissionError('Current User does not have required access right.')
    }
    return true
}

function doesShopHasAccessToCustomer(shop, customer){
    if(shop.access_customers === 'all'){
        return true
    }else if(shop.access_customers === 'selected'){
        return shop.access_selected_customers.indexOf(customer._id.toString()) >= 0
    }
    return false
}

function validateUserAgentAppAgainstShopUser(req, user, username){
    const userAgent = req.headers['user-agent'] || ''
    if(userAgent.includes('Mozilla')) return // skip checks if called from a webbrowser
    const userAgentName = userAgent.split('/')[0]
    if(!userAgentName) // if the client did not include it's user agent we deny the request
        throw new AuthError('User agent is required to perform a login request', 'empty_user_agent')
    const appConfig = apps[userAgentName]
    if(!appConfig)
        throw new AuthError('Unknow user agent app', 'unkonw_user_agent')
    const hasAccess = user[appConfig.accessFieldName]
    if(!hasAccess)
        throw new AuthError(`User '${username}' does not have access to this app`, 'missing_app_access_right')
}

module.exports.login = (req, res) => {
    const coll = client.db('comport').collection('shops')
    return auth.login(req, res, async (username, password) => {
        const user = await coll.findOne({ email: username })
        if(!user) return false
        const valid = user.pw === password
        if(valid){
            validateUserAgentAppAgainstShopUser(req, user, username)
            await coll.updateOne(
                { _id: ObjectId(user._id) },
                { $set: {
                    last_login: new Date().toISOString()
                } }
            )
            const { permissions, email, shop, userType } = user;
            return {
                valid: true,
                responsePayload:  {
                    userInfo: { permissions, email, shop, userType }
                }
            };
        }
        return false
    })
}

module.exports.protectRoutes = (req, res, next) => {
    const coll = client.db('comport').collection('shops')
    return auth.verify(req, res, next, ({ subject }) => coll.findOne({ email: subject }))
}

// ------------- Shop Admin Panel -------------

module.exports.getCustomers = (req, res) => WrapRouteHandler(
    req, res, null,
    () => ShopService.GetShopCustomers(req.user._id),
)

module.exports.updateCustomer = (req, res) => WrapRouteHandler(
    req, res, [() => validateShopUserType(req, res, ShopUserType.Reseller)],
    async () => {
        await ShopService.UpdateShopCustomer(req.user._id, req.params.customerId, req.body)
        return {}
    }
)

module.exports.createCustomer = (req, res) => WrapRouteHandler(
    req, res, [() => validateShopUserType(req, res, ShopUserType.Reseller)],
    () => ShopService.CreateShopCustomer(req.user._id, req.body)
)

module.exports.getFiles = (req, res) => WrapRouteHandler(
    req, res, [() => validateShopUserType(req, res, ShopUserType.Reseller)],
    () => ShopService.GetShopFiles(req.user._id)
)

module.exports.uploadFile = (req, res) => WrapRouteHandler(
    req, res, [() => validateShopUserType(req, res, ShopUserType.Reseller)],
    () => ShopService.UploadShopFile(
        req.user._id,
        req,
        decodeURIComponent(req.query.fileName),
        req.query.microType,
        req.query.vehicle
    )
)

module.exports.deleteFile = (req, res) => WrapRouteHandler(
    req, res, [() => validateShopUserType(req, res, ShopUserType.Reseller)],
    () => ShopService.DeleteShopFile(req.user._id, req.params.fileId),
    { EmptyResponse: true }
)

module.exports.getShopCredit = (req, res) => WrapRouteHandler(
    req, res, null, async () => {
        const shopId = req.user._id
        const Credit = await ShopService.GetShopCredit(shopId)
        return {
            Credit
        }
    }
)

module.exports.getShopWebAppInitialData = (req, res) => WrapRouteHandler(
    req, res, null,
    async () => {
        const shopId = req.user._id
        // const micros = await ShopService.GetShopAllowedModules(shopId)
        const vehicles = await ShopService.GetShopAllowedVehicles(shopId, true)
        const data = await ShopService.GetShopPartialData(shopId, {
            allowed_modules: true,
            credit: true,
        })
        return {
            AllowedMicros: data.allowed_modules || ({ ecus: [], tcus: [],  cpcs: [] }),
            AllowedVehicles: vehicles,
            Credit: data.credit,
            ModulesCosts: data.modules_costs
        }
    }
)

// --------------------------------------------