const { RemoteOBDSniffer } = require('./RemoteOBDSniffer')

/**
 * @param {import('../../typings/MicroApps').AppInitOptions} options 
 */
async function Init(options){
    const { app, db: { client, coll } } = options
    await RemoteOBDSniffer.Init(app, { client, coll })
}

module.exports = {
    Init
}