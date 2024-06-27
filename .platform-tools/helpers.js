const fs = require('fs')
const { exec: nativeExec } = require('child_process')

function GrabStringBetween(srcStr, str1, str2){
    const rightPart = srcStr.split(str1)[1];
    if(!IsValidString(rightPart)) return null;
    const leftPart = rightPart.split(str2)[0];
    return leftPart || null;
}


function IsValidString(value){
    return typeof value == 'string' && value.length > 0;
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
 * @param {string} cmd 
 * @returns {Promise<string>}
 */
 function exec(cmd){
    return new Promise((resolve, reject) => nativeExec(cmd, (error, stdout) => {
        if(error) reject(error)
        else resolve(stdout)
    }))
}

function sleep(time){
    return new Promise(r => setTimeout(r, time))
}

module.exports = {
    GrabStringBetween,
    IsValidString,
    readFile,
    exec,
    sleep
}