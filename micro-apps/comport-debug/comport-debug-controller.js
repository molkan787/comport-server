const { WrapRouteHandler } = require("../../helpers/controller-helpers")
const { ValidateParams } = require("../../helpers/inputValidation")
const { ComportDebugService } = require("./comportDebug")

async function PostException(req, res){
    return await WrapRouteHandler(req, res,
        () => ValidatePostExceptionInput(req, res),
        () => {
            const rud = req.query.UserDetails
            const UserDetails = typeof rud === 'string' ? JSON.parse(rud) : undefined
            return ComportDebugService.AddException(
                req.query.AppName,
                req.body,
                { UserDetails }
            )
        }
    )
}

function ValidatePostExceptionInput(req, res){
    const { ExceptionType, FullStackTrace, ExceptionString } = req.body || {}
    const { AppName } = req.query
    return ValidateParams(
        res,
        { AppName, ExceptionType, FullStackTrace, ExceptionString },
        {
            AppName: 'NoneEmptyString',
            ExceptionType: 'NoneEmptyString',
            FullStackTrace: 'Array',
            ExceptionString: 'NoneEmptyString'
        }
    )
}

module.exports = {
    PostException
}