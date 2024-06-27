const { exec: nativeExec } = require('child_process')
const fs = require('fs')

/**
 * 
 * @param  {...any} vars 
 * @returns {boolean}
 */
function validateStrings(...vars){
    for(let i = 0; i < vars.length; i++){
        let v = vars[i]
        if(typeof v !== 'string' || v.length === 0){
            return false
        }
    }
    return true
}

function sleep(time){
    return new Promise(r => setTimeout(r, time))
}

function numOrDefault(num, defaultValue){
    return typeof num == 'number' ? num : defaultValue
}

/**
 * 
 * @param {string} cmd 
 * @returns {Promise<string>}
 */
function exec(cmd){
    return new Promise((resolve, reject) => nativeExec(cmd, (error, stdout) => {
        if(error) reject(error)
        else resolve(stdout)
    }))
}

/**
 * 
 * @param {fs.PathOrFileDescriptor} path 
 * @param {NodeJS.ArrayBufferView | string} data 
 * @returns {Promise<void>}
 */
function writeFile(path, data){
    return new Promise((resolve, reject) => fs.writeFile(path, data, (error) => {
        if(error) reject(error)
        else resolve()
    }))
}

/**
 * @param {fs.PathOrFileDescriptor} path
 * @param {BufferEncoding} encoding
 * @returns {Promise<Buffer | string>}
 */
function readFile(path, encoding){
    return new Promise((resolve, reject) => fs.readFile(path, encoding, (error, data) => {
        if(error) reject(error)
        else resolve(data)
    }))
}

/**
 * 
 * @param {fs.PathLike} path
 * @returns {Promise<void>}
 */
function deleteFile(path){
    return new Promise((resolve, reject) => fs.unlink(path, (error) => {
        if(error) reject(error)
        else resolve()
    }))
}

/**
 * @param {fs.PathLike} path 
 * @returns {Promise<string[]>}
 */
function listDirectoryFiles(path){
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if(err) reject(err)
            else resolve(files)
        })
    })
}

/**
 * @param {fs.PathLike} path 
 * @returns {Promise<boolean>}
 */
async function fileExists(path){
    try {
        await fs.promises.access(path);
        return true
    } catch (error) {
        return false
    }
}

/**
 * @param {fs.PathLike} path 
 * @returns {Promise<boolean>}
 */
async function rmDir(path){
    return new Promise((resolve) => {
        fs.remove(path, resolve)
    })
}

function getRequestRawBody(request){
    // body parsing is handler now by a middleware, adjusted this function for backward compatibility
    return Promise.resolve(request.body)
}

function arrayToMap(array, keyGetter, valueGetter){
    const o = {}
    for(let i = 0; i < array.length; i++){
        const item = array[i]
        o[keyGetter(item)] = valueGetter(item)
    }
    return o
}

function queryBoolean(value){
    return value === 'true' || value === '1' || value === true
}

function stringIsNullOrEmpty(value){
    return typeof value != 'string' || value.length === 0
}

/**
 * 
 * @param {number[] | Buffer} data 
 */
function toHex(data){
    if(typeof data == 'undefined' || data === null) return null
    if(Buffer.isBuffer(data)){
        return data.toString('hex')
    }else{
        return data.map(n => n.toString(16).padStart(2, '0')).join('')
    }
}

/**
 * 
 * @param {Buffer | number[] | string} data 
 */
function getAscii(data){
    if(typeof data == 'undefined' || data === null) return null
    if(typeof data === 'string'){
        data = Buffer.from(data, 'hex')
    }else if(Array.isArray(data)){
        data = Buffer.from(data)
    }else if(!Buffer.isBuffer(data)){
        throw new Error('Invalid input data type')
    }
    return new TextDecoder().decode(data)
}

function Hex(strHex){
    return Buffer.from(strHex, 'hex')
}

module.exports = {
    validateStrings,
    sleep,
    numOrDefault,
    exec,
    writeFile,
    readFile,
    deleteFile,
    listDirectoryFiles,
    getRequestRawBody,
    fileExists,
    arrayToMap,
    queryBoolean,
    stringIsNullOrEmpty,
    toHex,
    getAscii,
    Hex,
    rmDir
}