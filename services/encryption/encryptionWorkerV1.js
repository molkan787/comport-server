const NodeRSA = require('node-rsa')
const { expose, Transfer } = require("threads/worker")

expose({
    encrypt(arrayBuffer, key){
        const rsa =  new NodeRSA()
        rsa.importKey(key, 'public')
        const buf = Buffer.from(arrayBuffer)
        const result = rsa.encrypt(buf)
        return Transfer(result.buffer)
    },
    decrypt(arrayBuffer, key){
        const rsa =  new NodeRSA()
        rsa.importKey(key, 'private')
        const buf = Buffer.from(arrayBuffer)
        const result = rsa.decrypt(buf)
        return Transfer(result.buffer)
    }
})