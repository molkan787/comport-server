const { CPCCompressionServer } = require('./cpc-compression-server')

/**
 * @param {import('../../typings/MicroApps').AppInitOptions} options 
 */
async function Init(options){
    await CPCCompressionServer.Init(options)
}
module.exports = {
    Init
}