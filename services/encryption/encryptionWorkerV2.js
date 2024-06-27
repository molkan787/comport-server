const aesjs = require('aes-js');
const { expose, Transfer } = require("threads/worker")

expose({
    encrypt(arrayBuffer, key, iv){
        return doWork('encrypt', arrayBuffer, key, iv)
    },
    decrypt(arrayBuffer, key, iv){
        return doWork('decrypt', arrayBuffer, key, iv)
    }
})

function doWork(action, arrayBuffer, key, iv){
    if(typeof key == 'string') key = Buffer.from(key.replace(/\s/g, ''), 'hex')
    if(typeof iv == 'string') iv = Buffer.from(iv.replace(/\s/g, ''), 'hex')
    const aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
    const buf = Buffer.from(arrayBuffer)
    const result = action == 'encrypt' ? aesCbc.encrypt(buf) : aesCbc.decrypt(buf)
    return Transfer(result.buffer)
}