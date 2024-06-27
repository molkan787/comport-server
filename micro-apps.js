const RemoteOBDSniffer = require('./micro-apps/remote-obd-sniffer')
const ComportDebug = require('./micro-apps/comport-debug')
const ShopsApp = require('./micro-apps/shops')

class MicroApps{

    /**
     * @param {import('./typings/MicroApps').AppInitOptions} options 
     */
    static async InitAll(options){
        await Promise.all([
            RemoteOBDSniffer.Init(options),
            ComportDebug.Init(options),
            ShopsApp.Init(options)
        ])
    }

}

module.exports = {
    MicroApps
}