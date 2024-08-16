const { DLLSeekKeyServer } = require('./dll-seedkey-server')


/**
 * @param {import('../../typings/MicroApps').AppInitOptions} options 
 */
async function Init(options){
    await DLLSeekKeyServer.Init(options)
}
module.exports = {
    Init
}