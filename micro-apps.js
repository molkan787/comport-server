const RemoteOBDSniffer = require('./micro-apps/remote-obd-sniffer')
const ComportDebug = require('./micro-apps/comport-debug')
const ShopsApp = require('./micro-apps/shops')
const DLLSeekKeyServer = require('./micro-apps/dll-seedkey')
// const CPCCompressionServer = require('./micro-apps/cpc-compression')

class MicroApps{

    /**
     * @param {import('./typings/MicroApps').AppInitOptions} options 
     */
    static async InitAll(options){
        await Promise.all([
            RemoteOBDSniffer.Init(options),
            ComportDebug.Init(options),
            ShopsApp.Init(options),
            DLLSeekKeyServer.Init(options),
            // CPCCompressionServer.Init(options),
        ])
    }

}

module.exports = {
    MicroApps
}