function ValidateStringParams (httpRes, params, allowEmptyStrings){
    const validator = allowEmptyStrings ?
        ( (v, k) => typeof v === 'string' ) :
        ( (v, k) => typeof v === 'string' && v.trim().length > 0 )
    return ValidateValues(httpRes, params, validator);
}

function ValidateValues(httpRes, params, validator){
    const entries = Object.entries(params);
    for(let i = 0; i < entries.length; i++){
        const [key, value] = entries[i];
        const _validator = (
            typeof validator == 'object'
            ? validator[key] || validator['_default']
            : validator
        )
        const valid = _validator(value, key);
        if(!valid){
            httpRes.status(400);
            httpRes.send({
                error: 'invalid_input',
                message: `One or more of the input paramters are either missing or invalid,\nParameters: '${key}'`
            })
            return false;
        }
    }
    return true;
}

const ParamsValidators = Object.freeze({
    NoneEmptyString: v => typeof v === 'string' && v.length > 0,
    Buffer: v => Buffer.isBuffer(v),
    Array: v => Array.isArray(v),
    NoneEmptyBuffer: v => Buffer.isBuffer(v) && v.length > 0,
    NoneEmptyArray: v => Array.isArray(v) && v.length > 0,
})

/**
 * @typedef {typeof ParamsValidators} ParamsValidatorsType
 * @param {import('express').Response} httpResponse 
 * @param {Record<string, any>} params 
 * @param {Record<string, (keyof ParamsValidatorsType) | (v: any) => boolean>?} validators 
 */
function ValidateParams (httpResponse, params, validators){
    const _validators = {
        _default: ParamsValidators.NoneEmptyString
    }
    if(typeof validators == 'object'){
        for(let [k, v] of Object.entries(validators)){
            if(typeof v == 'string'){
                _validators[k] = ParamsValidators[v]
            }else{
                _validators[k] = v
            }
            if(typeof _validators[k] !== 'function'){
                throw new Error('ValidateParams: Invalid Validator')
            }
        }
    }

    return ValidateValues(httpResponse, params, _validators)
}


module.exports = {
    ValidateStringParams,
    ValidateParams,
    ParamsValidators
}