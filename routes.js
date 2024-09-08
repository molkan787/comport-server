const express = require('express')
const expressHttpProxy = require('express-http-proxy');
const path = require('path')

const { GenericAuthRoutesFactory } = require('./services/genericAuth')
const CORS = require('./middlewares/cors')

const login = require('./controllers/login')
const appupdates = require('./controllers/app-updates')
const flashes = require('./controllers/flashes')
const feedback = require('./controllers/feedback')
const shop = require('./controllers/shop')
const definitions = require('./controllers/definitions')
const tuneFile = require('./controllers/tune-file')
const encryption = require('./controllers/encryption')
const dataReporting = require('./controllers/data-reporting')
const Tools = require('./controllers/tools')
const UserLogs = require('./controllers/userlogs')
const AdminController = require('./controllers/admin')
const KvsController = require('./controllers/kvs')
const BinToolsController = require('./controllers/binTools')
const TunerToolsController = require('./controllers/tunertools')
const MicrosDefinitionsController = require('./controllers/micros-definitions')
const DynoDbController = require('./controllers/dynodb')
const ValuesServerController = require('./controllers/values-server')
const CustomerInfoControllers = require('./controllers/admin/customer-info');
const FlashDataPackerControllers = require('./controllers/flash-data-packer');
const { GetTLSCertThumbprint } = require('./controllers/security');
const customerWebhooks = require('./controllers/webhooks/create-customer');
const shopCreditWebhooks = require('./controllers/webhooks/shop-credit');
const tunerCreditWebhooks = require('./controllers/webhooks/tuner-credit');

/**
 * @param {import('express').Express} app 
 */
function mountHelpers(app){
    app.use('/prv/shop/*', CORS.AllowAll)
    app.post('/prv/shop/login', shop.login)
    app.use('/prv/shop/*', shop.protectRoutes)
    app.post('/admin/login', AdminController.Login)
    app.use('/admin/*', AdminController.ProtectRoutes)
    app.use('/micros-definitions/upload-compiled-definition', AdminController.ProtectRoutes)
    app.use('/micros-definitions-v2/upload-compiled-definition', AdminController.ProtectRoutes)
    app.use('/micros-definitions-v2/reuse-compiled-definition', AdminController.ProtectRoutes)
    app.use('/dynodb/add-entry', AdminController.ProtectRoutes)
    app.use('/dynodb/edit-entry', AdminController.ProtectRoutes)
    app.use('/dynodb/delete-entry', AdminController.ProtectRoutes)
    app.get('/dynodb/run-data/*', AdminController.ProtectRoutes)
}

/**
 * @param {import('express').Express} app 
 */
function mountRoutes(app){

    app.get('/server/ping', GetTLSCertThumbprint)

    app.get("/admin/customer-info/flashing-history/:customerId", CustomerInfoControllers.getCustomerFlashingHistory)

    app.post('/prv/login', login)
    app.post('/prv/feedback/flash', feedback.flash)
    app.post('/prv/feedback/flash-v2', feedback.flashV2)
    app.post('/prv/userlogs', UserLogs.AddLogs)


    app.post('/prv/report-data', dataReporting.ReportData)

    app.post('/pub/encryption/encrypt', encryption.encrypt)
    app.post('/pub/encryption/decrypt', encryption.decrypt)

    app.post('/prv/shop/uploadFirmware', shop.uploadFirmware)
    app.get('/prv/shop/customerFiles', shop.getCustomerFiles)
    app.delete('/prv/shop/deleteFirmware', shop.deleteCustomerFile)
    app.get('/prv/shop/getStockFile', shop.getStockFile)
    app.get('/prv/shop/findStockFile', shop.findStockFile)
    app.get('/prv/shop/getStockFile-byCustomer', shop.getStockFileByCustomer)
    app.get('/prv/shop/customerExist', shop.customerExist)
    app.get('/prv/shop/definitions/:calibrationNumber', definitions.getDefinition)
    app.get('/prv/shop/customers', shop.getCustomers)
    app.post('/prv/shop/update-customer/:customerId', shop.updateCustomer)
    app.post('/prv/shop/create-customer', shop.createCustomer)
    app.get('/prv/shop/files', shop.getFiles)
    app.post('/prv/shop/upload-file', shop.uploadFile)
    app.delete('/prv/shop/delete-file/:fileId', shop.deleteFile)
    app.get('/prv/shop/webapp/initial-data', shop.getShopWebAppInitialData)
    app.get('/prv/shop/webapp/shop-credit', shop.getShopCredit)

    app.get('/pub/app-updates', appupdates.getUpdateInformation)
    app.get('/pub/app-info/latest-app-version', appupdates.getLatestAppVersion)

    app.get('/pub/flashes/:software_number/:email/:vin', flashes.listFlashes)
    app.get('/pub/flashes/:email/:vin', flashes.listFlashes)
    app.get('/pub/flashes/special-file', flashes.getSpecialFileRoute)

    app.get('/ptd/downloadtune/:downloadTicket', tuneFile.downloadTuneFile)
    app.get('/ptd/downloadtune/:downloadTicket/:fileName', tuneFile.downloadTuneFile)

    app.post('/pub/tools/:tool', (req, res) => Tools.handleRequest(req, res))

    app.use('/dl', express.static('public'))

    app.get('/admin/userlogs/:userId', UserLogs.GetLogs)
    app.delete('/admin/userlogs/:userId', UserLogs.ClearLogs)
    app.post('/admin/kvs/set-values', KvsController.SetValues)
    app.post('/admin/kvs/get-values', KvsController.GetValues)
    app.post('/admin/kvs/delete-values', KvsController.DeleteValues)

    app.post('/tuners/login', TunerToolsController.Login)
    app.use('/tuners/*', TunerToolsController.ProtectRoutes)
    app.post('/tuners/bin-tools/apply', BinToolsController.Apply)
    app.get('/tuners/bin-tools/list', BinToolsController.ListTools)
    app.get('/tuners/get-info', TunerToolsController.GetInfo)

    // TODO: Make v1 paths uses V2 routes handlers & remove v2 paths (after all apps updated to use v1 paths)
    app.get('/micros-definitions/compiled-definition', MicrosDefinitionsController.GetCompiledMicroDefinition)
    app.post('/micros-definitions/upload-compiled-definition', MicrosDefinitionsController.UploadMicroCompiledDefinition)

    app.get('/micros-definitions-v2/compiled-definition', MicrosDefinitionsController.GetCompiledMicroDefinitionV2)
    app.post('/micros-definitions-v2/upload-compiled-definition', MicrosDefinitionsController.UploadMicroCompiledDefinitionV2)
    app.post('/micros-definitions-v2/reuse-compiled-definition', MicrosDefinitionsController.ReuseMicrosCompiledDefinitions)

    
    app.use('/dynodb/entries', CORS.AllowAll)
    app.post('/dynodb/add-entry', DynoDbController.AddEntry)
    app.post('/dynodb/edit-entry', DynoDbController.EditEntry)
    app.delete('/dynodb/delete-entry', DynoDbController.DeleteEntry)
    app.get('/dynodb/entries', DynoDbController.GetEntries)
    app.get('/dynodb/entry/:entryId/runs-data', DynoDbController.GetRunsData)
    app.get('/dynodb/entry/:entryId/:runDataId/series', DynoDbController.GetRunSeries)
    app.get('/dynodb/run-data/raw-file/:fileId', DynoDbController.GetRunDataFile)
    app.get('/dynodb/shops', DynoDbController.GetShopsList)
    app.get('/dynodb/shop/:shopId/logo', DynoDbController.GetShopLogo)
    app.use('/dynodb/front-app/*', CORS.AllowAll)
    app.get('/dynodb/front-app/initial-data', DynoDbController.GetFrontInitialData)

    app.use('/dynodb/list-entries', AdminController.ProtectRoutes)
    app.get('/dynodb/list-entries', DynoDbController.GetEntriesByAdmin)



    const dynoShopsAuth = DynoDbController.GetAdminAuthRoutes()
    app.use('/dynodb-admin/*', CORS.AllowAll)
    app.post('/dynodb-admin/login', dynoShopsAuth.loginRoute)
    app.use('/dynodb-admin/*', dynoShopsAuth.protectRoutes)
    app.get('/dynodb-admin/cars', DynoDbController.GetCarsList)
    app.post('/dynodb-admin/edit-car', DynoDbController.EditCar)
    app.delete('/dynodb-admin/car/:id', DynoDbController.DeleteCar)

    app.get('/values/switchover/:micro', ValuesServerController.GetSwitchOver)
    app.get('/values/my-switchover/:micro', ValuesServerController.GetMySwitchOver)
    app.get('/values/calc-my-switchover', ValuesServerController.CalcMySwitchOver)

    const dynodbAppDir = path.join(__dirname, '..', 'dynodb_webapp')
    app.use('/static/dynodb', express.static(dynodbAppDir))
    app.use('/static/dynodb/administration', express.static(dynodbAppDir))
    app.use('/dynodb-server', expressHttpProxy('http://localhost:8101'))

    app.post('/flash-data-packer/pack', FlashDataPackerControllers.PackRoute)

    app.get('/get-my-ip', (req, res) => {
        const ip = req.socket.remoteAddress
        res.send(ip)
    })

    // Webhooks
    app.post('/webhooks/create-customer', customerWebhooks.createCustomer)
    app.post('/webhooks/update-customer', customerWebhooks.updateCustomer)
    app.post('/webhooks/add-shop-credit', shopCreditWebhooks.AddShopCredit)
    app.post('/webhooks/add-tuner-credit', tunerCreditWebhooks.AddTunerCredit)
}

module.exports = {
    mountHelpers,
    mountRoutes
}