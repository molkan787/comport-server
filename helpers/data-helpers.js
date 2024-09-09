
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

/**
 * Returns the first part of data from buffer2 that is not the same on both Buffers
 * @param {Buffer} buffer1 
 * @param {Buffer} buffer2 
 */
function getFirstBuffersDiff(buffer1, buffer2){
    const len = Math.max(buffer1.length, buffer2.length)
    const diffData = []
    let diffFound = false
    for(let i = 0; i < len; i++){
        const a = buffer1[i]
        const b = buffer2[i]
        if(typeof a === 'undefined' || typeof b === 'undefined'){
            break
        }
        if(a !== b){
            diffFound = true
            diffData.push(b)
        }else if(diffFound){
            break
        }
    }
    return Buffer.from(diffData)
}

module.exports = {
    parseIntNumber,
    getFirstBuffersDiff,
}