/**
 * Maps array items into a key-value dictionary (as simple js object)
 * @param {any[]} array 
 * @param {(item:any)=>any} keyGetter 
 * @param {((item:any)=>any)} valueGetter 
 * @returns {Object}
 */
function ArrayToObject(array, keyGetter, valueGetter){
    const o = {}
    const len = array.length
    for(let i = 0; i < len; i++){
        const item = array[i]
        const key = keyGetter(item)
        const value = !!valueGetter ? valueGetter(item) : item
        o[key] = value
    }
    return o
}

function IsValidString(value){
    return typeof value == 'string' && value.length > 0;
}

/**
 * Checks if all provided values are none-empty strings
 * @param  {...any} values 
 */
function AreValidStrings(...values){
    return values.map(v => IsValidString(v) ? 0 : 1).reduce((p, c) => p + c, 0) === 0
}

function IsValidObject(value){
    return typeof value == 'object' && value !== null;
}

const IsNotValidString = value => !IsValidString(value);
const IsNotValidObject = value => !IsValidObject(value);

/**
 * 
 * @param {ReadableStream} stream 
 * @returns {Promise<Buffer>}
 */
const StreamToBuffer = stream => new Promise((resolve, reject) => {
    let bufs = []
    stream.on('data', d => bufs.push(d))
    stream.on('end', async () => {
        const fullData = Buffer.concat(bufs)
        resolve(fullData)
    })
    stream.on('error', err => reject(err))
})

function GetPropValue(obj, propPath){
    const props = propPath.split('.')
    let o = obj
    for(let i = 0; i < props.length; i++){
        if(typeof o == 'undefined' || o === null) return undefined
        const p = props[i]
        const next = o[p]
        if(i + 1 === props.length) return next
        else o = next
    }
    return undefined
}

/**
 * @param {Buffer} buffer 
 */
function CloneBuffer(buffer){
    const cloned = new Buffer.alloc(buffer.length)
    buffer.copy(cloned, 0, 0, buffer.length)
    return cloned
}

module.exports = {
    ArrayToObject,
    IsValidString,
    IsValidObject,
    IsNotValidString,
    IsNotValidObject,
    StreamToBuffer,
    GetPropValue,
    CloneBuffer,
    AreValidStrings
}