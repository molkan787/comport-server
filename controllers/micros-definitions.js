const { ValidateStringParams } = require('../helpers/inputValidation');
const { AuthenticateCustomerFromQuery } = require('../services/customers');
const KvsService = require('../services/kvs')
const MicrosDefinitionsService = require('../services/microsDefinitions')
const { micros_definitions: { valid_micro_types } } = require('../config.json');
const ReleasesHistoryService = require('../services/releasesHistory');

const MICRO_HASHES_CACHE_STORAGE_KEY = 'micros-defs-hashes-cache';

module.exports = class MicrosDefinitionsController{

    static async GetCompiledMicroDefinition(req, res){
        try {
            const authenticated = await AuthenticateCustomerFromQuery(req, res);
            if(!authenticated) return;
            const { microType, microModel } = req.query
            if(!valid_micro_types.includes(microType)){
                res.status(400)
                res.send({ error: 'invalid_input', message: "Invalid micro type." })
                return
            }
            // const customerMicro = req.customer[microType] || ''
            // if(customerMicro.toLowerCase().trim() !== microModel.toLowerCase().trim()){
            //     res.status(400)
            //     res.send({ error: 'access_denied', message: 'The requesting customer does not have access to the specified microcontroller definition.' })
            //     return
            // }
            const readStream = await MicrosDefinitionsService.GetCompiledDefinition(microType, microModel)
            if(readStream === null){
                res.status(404)
                res.send({ error: 'not_found', message: 'The specified microcontroller model was not found' })
                return
            }
            readStream.on('end', () => res.end())
            readStream.pipe(res)
        } catch (error) {
            console.log(error)
            res.status(500)
            res.end()
        }
    }

    static async UploadMicroCompiledDefinition(req, res){
        try {
            const { microType, microModel, microSourceHash } = req.query
            if(!ValidateStringParams(res, { microType, microModel, microSourceHash }, false)) return;
            await MicrosDefinitionsService.SetCompiledDefinition(microType, microModel, req)
            await KvsService.SetValue(MICRO_HASHES_CACHE_STORAGE_KEY, microModel, microSourceHash);
            res.send({})
        } catch (error) {
            console.log(error)
            res.status(500)
            res.end()
        }
    }

    // -------------------------------------------------------------

    static async GetCompiledMicroDefinitionV2(req, res){
        try {
            const authenticated = await AuthenticateCustomerFromQuery(req, res);
            if(!authenticated) return;
            const { microType, microModel, appName, appVersion, microSourceHash } = req.query
            if(!valid_micro_types.includes(microType)){
                res.status(400)
                res.send({ error: 'invalid_input', message: "Invalid micro type." })
                return
            }
            const readStream = await MicrosDefinitionsService.GetCompiledMicroDefinition({
                appName: appName,
                appVersion: appVersion,
                microType: microType,
                microModel: microModel,
                microSourceHash: microSourceHash
            })
            if(readStream === null){
                res.status(404)
                res.send({ error: 'not_found', message: 'The specified microcontroller model was not found' })
                return
            }
            readStream.on('end', () => res.end())
            readStream.pipe(res)
        } catch (error) {
            console.log(error)
            res.status(500)
            res.end()
        }
    }
    
    static async UploadMicroCompiledDefinitionV2(req, res){
        try {
            const { microType, microModel, appName, appVersion, microSourceHash } = req.query
            if(!ValidateStringParams(res, { microType, microModel, appName, appVersion, microSourceHash }, false)) return;
            await MicrosDefinitionsService.AddCompiledMicroDefinition(req, {
                appName: appName,
                appVersion: appVersion,
                microType: microType,
                microModel: microModel,
                microSourceHash: microSourceHash
            })
            await KvsService.SetValue(`${MICRO_HASHES_CACHE_STORAGE_KEY}_${appName}`, microModel, microSourceHash);
            res.send({})
        } catch (error) {
            console.log(error)
            res.status(500)
            res.end()
        }
    }

    static async ReuseMicrosCompiledDefinitions(req, res){
        const { appName, appVersion, microsList } = req.body
        const dfv = { appName, appVersion, microsList: Array.isArray(microsList) ? '1' : null }
        if(!ValidateStringParams(res, dfv, false)) return
        const reusedMicros = await MicrosDefinitionsService.ReuseCompiledMicrosDefinitions(
            {
                appName: appName,
                appVersion: appVersion
            },
            microsList
        )
        res.send({ reusedMicros })
    }

}