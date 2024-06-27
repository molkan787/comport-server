
/**
 * Wraps route handlers to catch error and properly handle them, also facilitate sending responses by using the return value as http response
 * @typedef {(() => Promise<boolean>) | ((req: import('express').Request, res: import('express').Response) => Promise<boolean>)} InputValidator
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {InputValidator | InputValidator[] | null} inputValidators Function that performs the validation of input, should return `false` in the input is invalid, Sending the proper error message should be handler by this function
 * @param {() => Promise<any>} handler The actual request handler, the returned value is send as http response
 * @param {{ CORS?: boolean, EmptyResponse?: boolean }?} options
 */
async function WrapRouteHandler(req, res, inputValidators, handler, options){
    try {
        if(typeof inputValidators == 'function'){
            const valid = await inputValidators()
            if(!valid) return;
        }else if(Array.isArray(inputValidators)){
            for(let validator of inputValidators){
                const valid = await validator()
                if(!valid) return;
            }
        }
        if(options && options.CORS){
            res.header('Access-Control-Allow-Origin', '*')
        }
        const value = await handler()
        if(typeof value != 'undefined'){
            res.send(value)
        }else if(options && options.EmptyResponse){
            res.send('')
        }// in other case the response should be sent directly by the handler function
    } catch (error) {
        const userInfo = (req.customer && req.customer.email) || ''
        console.error(`Request: ${(req.method || '-').toUpperCase()} '${req.url}' ${userInfo}`)
        console.error(error)
        if(error.IsUserError){
            res.status(error.HttpResponseCode || 500)
            res.send(error.message)
        }else{
            res.status(500)
            res.send('Internal Server Error')
        }
    }
}

/**
 * 
 * @param {import('express').Response} res 
 * @param {string?} message 
 */
function NotFound(res, message){
    if(typeof message !== 'string' && typeof message !== 'undefined'){
        throw new Error('Invalid message type');
    }
    res.status(404);
    res.send(message || 'Resource not found.');
}

module.exports = {
    WrapRouteHandler,
    NotFound
}