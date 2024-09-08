
/**
 * Parses a number from a string (either decimal or hex representation)
 * @param {any} value 
 * @param {boolean} forceNumber Whether to force returning a valid number even when the input value is invalid (usefull to guarantee a number)
 * @returns {number}
 */
function parseIntNumber(value, forceNumber){
    let result = null
    if(typeof value === 'number'){
        result = value
    }else if(typeof value === 'string'){
        const radix = value.startsWith('0x') ? 16 : 10
        const parsedValue = parseInt(value, radix)
        result = parsedValue
    }else{
        result = NaN
    }
    if((typeof result !== 'number' || isNaN(result)) && forceNumber){
        return 0
    }else{
        return result
    }
}

module.exports = {
    parseIntNumber,
}