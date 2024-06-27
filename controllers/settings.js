const { SettingStore } = require("../core-services/SettingStoreService");
const { WrapRouteHandler } = require("../helpers/controller-helpers");
const { ValidateParams } = require("../helpers/inputValidation");

class SettingsController{

    async SaveSettings(req, res){
        const { items } = req.body
        await WrapRouteHandler(req, res, 
            () => ValidateParams(res, { items }, { items: 'Array' }),
            () => SettingStore.SetBulkValues(items)
        )
    }

    // TODO: Complete Settings controller (mount it on the app, and test it)

}