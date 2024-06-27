const { ObjectId } = require("mongodb")
const { SettingStore, SettingKeys } = require("../core-services/SettingStoreService")
const { WrapRouteHandler, NotFound } = require("../helpers/controller-helpers")
const { ValidateStringParams, ValidateParams } = require("../helpers/inputValidation")
const { IsValidObject, IsValidString } = require("../jsutils")
const DynoDbService = require("../services/dynodb")
const { GenericAuthRoutesFactory } = require("../services/genericAuth")
const GenericEntriesService = require("../services/genericEntries")

module.exports = class DynoDbController{

    static async AddEntry(req, res){
        try {
            const { shop, make, model, year, owner, display_in_dyno_app, runDataItems } = req.body
            if(!ValidateParams(res,
                { shop, make, model, year, owner, runDataItems },
                { runDataItems: 'Array', _default: 'NoneEmptyString' }
            )) return;

            const carData = { shop, make, model, year, owner, display_in_dyno_app }
            const entry = await DynoDbService.AddEntry(carData, runDataItems)
            res.send({
                entry
            })
        } catch (error) {
            console.error(error)
            res.status(500)
            res.send('Internal Server Error')
        }
    }
    
    static async EditEntry(req, res){
        try {
            const { _id, shop, make, model, year, owner, display_in_dyno_app, runDataItems } = req.body
            if(!ValidateParams(res,
                { shop, make, model, year, owner, _id },
                { runDataItems: 'Array', _default: 'NoneEmptyString' }
            )) return;

            const carData = { shop, make, model, year, owner, display_in_dyno_app }
            const entry = await DynoDbService.EditEntry(_id, carData, runDataItems)
            res.send({
                entry
            })
        } catch (error) {
            console.error(error)
            res.status(500)
            res.send('Internal Server Error')
        }
    }

    static async DeleteEntry(req, res){
        try {
            const { entryId } = req.query
            if(!ValidateStringParams(res, { entryId }, false))
                return;

            await DynoDbService.DeleteEntry(entryId)
            res.send({ status: 'ok' });
        } catch (error) {
            console.error(error)
            res.status(500)
            res.send('Internal Server Error')
        }
    }

    static async GetFrontInitialData(req, res){
        await WrapRouteHandler(req, res, null,
            async () => {
                const { shopId } = req.query
                const filters = Object.assign(
                    { display_in_dyno_app: true },
                    ( IsValidString(shopId) ? { shop: shopId } : null )
                )
                const [ entries, shops, makes ] = await Promise.all([
                    await DynoDbService.GetEntries(filters, { includeRunsDescriptions: true }),
                    await DynoDbService.GetShops(),
                    await SettingStore.GetValue(SettingKeys.CARS_MAKES)
                ])
                return { entries, shops, makes }
            }
        )
    }

    static GetEntries(req, res){
        return DynoDbController._Shared_GetEntries(req, res, { display_in_dyno_app: true })
    }

    static GetEntriesByAdmin(req, res){
        return DynoDbController._Shared_GetEntries(req, res, {})
    }

    static async _Shared_GetEntries(req, res, initialFilters){
        try {
            const { includeRunsDescriptions, entryIds, shopId } = req.query
            const filters = initialFilters
            if(IsValidString(shopId)){
                filters.shop = shopId
            }else if(typeof entryIds == 'string'){
                const aEntryIds = entryIds.split(',').map(e => e.trim()).filter(e => e.length > 0)
                filters._id = { $in: aEntryIds.map(eid => ObjectId(eid)) }
            }
            const bIncludeRunsDescriptions = includeRunsDescriptions === 'true' || includeRunsDescriptions === '1'
            const entries = await DynoDbService.GetEntries(filters, { includeRunsDescriptions: bIncludeRunsDescriptions })
            res.send({
                entries
            })
        } catch (error) {
            console.error(error)
            res.status(500)
            res.send('Internal Server Error')
        }
    }

    static async GetRunsData(req, res){
        const { entryId } = req.params
        await WrapRouteHandler(req, res,
            () => ValidateParams(res, { entryId }),
            () => DynoDbService.GetRunsData(entryId),
            { CORS: true }
        )
    }

    static async GetRunSeries(req, res){
        const { entryId, runDataId } = req.params
        await WrapRouteHandler(req, res,
            () => ValidateParams(res, { entryId, runDataId }),
            () => DynoDbService.GetRunSeries(entryId, runDataId),
            { CORS: true }
        )
    }

    static async GetShopsList(req, res){
        await WrapRouteHandler(req, res, null,
            () => DynoDbService.GetShops(),
            { CORS: true }
        )
    }

    static async GetShopLogo(req, res){
        const { shopId } = req.params;
        await WrapRouteHandler(req, res,
            () => ValidateStringParams(res, { shopId }, false),
            async () => {
                res.header('Content-Type', 'application/octet-stream');
                const success = await DynoDbService.GetShopLogo(shopId, res);
                if(!success){
                    NotFound(res);
                }
            }
        );
    }

    static async GetRunDataFile(req, res){
        const { fileId } = req.params
        await WrapRouteHandler(req, res,
            () => ValidateParams(res, { fileId }),
            async () => {
                await DynoDbService.DownloadRunDataFile(fileId, res)
                res.end()
            }
        )
    }

    // ==================== Administration ====================
    // ========================================================

    static async GetCarsList(req, res){
        await WrapRouteHandler(
            req, res, null,
            () => DynoDbService.GetShopEntries(req.user)
        )
    }

    static async EditCar(req, res){
        await WrapRouteHandler(
            req, res,
            () => IsValidObject(req.body),
            () => DynoDbService.EditEntryByShop(req.user, req.body)
        )
    }

    static async DeleteCar(req, res){
        await WrapRouteHandler(
            req, res,
            () => IsValidString(req.params.id),
            async () => {
                await DynoDbService.DeleteEntryByShop(req.user, req.params.id)
                return {}
            }
        )
    }

    static GetAdminAuthRoutes(){
        return GenericAuthRoutesFactory.make('dynodb_shops', {
            userGetter: u => GenericEntriesService.GetEntry('dynodb_shops', { username: u, enable_dyno_admin_app_access: true }),
            payloadGetter: ({ _id, name }) => ({ _id, name })
        })
    }

}