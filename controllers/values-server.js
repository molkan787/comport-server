const BadRequestError = require('../framework/errors/BadRequestError')
const InvalidInputError = require('../framework/errors/InvalidInputError')
const { WrapRouteHandler } = require('../helpers/controller-helpers')
const { AuthenticateCustomerFromQuery, GetCustomerById } = require('../services/customers')
const KvsService = require('../services/kvs')
const { TasksManager } = require('../tasks')
const { TcuSwitchoverPopulator } = require('../tasks/tcu-switchover-populator')

module.exports = class ValuesServerController{

    static async GetSwitchOver(req, res){
        await WrapRouteHandler(req, res,
            () => AuthenticateCustomerFromQuery(req, res),
            async () => ({
                switchOver: await KvsService.GetValue('switchover', req.params.micro)
            })
        )
    }

    static async GetMySwitchOver(req, res){
        await WrapRouteHandler(req, res,
            () => AuthenticateCustomerFromQuery(req, res),
            async () => {
                /** @type {TcuSwitchoverPopulator} */
                const tcuSwTask = TasksManager.GetTaskInstanceByName(TcuSwitchoverPopulator.name)
                await tcuSwTask.EnsureTcuSwitchover(req.customer)
                const dbCustomer = await GetCustomerById(req.customer._id)
                return {
                    switchOver: (dbCustomer.otherInfo || {})[`${req.params.micro.toLowerCase()}_switchover`]
                }
            }   
        )
    }

    static async CalcMySwitchOver(req, res){
        await WrapRouteHandler(req, res,
            () => AuthenticateCustomerFromQuery(req, res),
            async () => {
                if(req.customer.tcu !== 'VGSNAG3'){
                    throw new BadRequestError('Unsupported microcotroller.')
                }
                const { serialNo } = req.query
                if(typeof serialNo !== 'string' || serialNo.length !== 11){
                    throw new InvalidInputError('Missing or invalid Serial Number.')
                }
                /** @type {TcuSwitchoverPopulator} */
                const tcuSwTask = TasksManager.GetTaskInstanceByName(TcuSwitchoverPopulator.name)
                const switchover = await tcuSwTask.PopulateTcuSwitchover(req.customer, serialNo)
                return {
                    switchOver: switchover
                }
            }   
        )
    }

}