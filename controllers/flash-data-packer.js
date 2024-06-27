const InvalidInputError = require('../framework/errors/InvalidInputError')
const NoPermissionError = require('../framework/errors/NoPermissionError')
const { WrapRouteHandler } = require('../helpers/controller-helpers')
const { AuthenticateCustomerFromQuery } = require('../services/customers')
const { FlashDataPackerService } = require('../services/flashDataPacker')
const { validateStrings } = require('../utils')

async function PackRoute(req, res){
    return await WrapRouteHandler(req, res,
        async () => {
            const validCustomer = await AuthenticateCustomerFromQuery(req, res)
            if(!validCustomer) throw new NoPermissionError('Unauthorized')
            const rawOptions = req.query.options
            if(typeof rawOptions !== 'string') throw new InvalidInputError('Missing options argument')
            const options = JSON.parse(req.query.options)
            const { MicroName, SoftwareNumber, Padding } = options
            const validOptions = validateStrings(MicroName, SoftwareNumber)
            if(!validOptions) throw new InvalidInputError('Invalid or missing options')
            const haveAccess = CustomerHaveAccessToMicro(req.customer, MicroName)
            if(!haveAccess) throw new NoPermissionError(`This customer does not have access to micro '${MicroName}'`)
            req.rOptions = { MicroName, SoftwareNumber, Padding }
            return true
        },
        () => FlashDataPackerService.Pack(req.body, req.rOptions)
    )
}

function CustomerHaveAccessToMicro(customer, microName){
    const { ecu, tcu, cpc } = customer
    return (
        ecu === microName ||
        tcu === microName ||
        cpc === microName
    )
}

module.exports = {
    PackRoute
}