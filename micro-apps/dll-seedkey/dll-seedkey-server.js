const axios = require('axios')
const ExternalProgramsService = require('../../services/externalPrograms')
const { sleep, spawn } = require('../../utils')


class DLLSeekKeyServer{
    
    static HTTP_SERVER_PORT = -1

    /**
     * @param {import('../../typings/MicroApps').AppInitOptions} options 
     */
    static async Init(options){
        this.HTTP_SERVER_PORT = options._PortsConfig._PortBase + 731
        this.runServer(this.HTTP_SERVER_PORT)
    }

    /**
     * @param {number} port 
     */
    static async runServer(port){
        const exeAppFilename = ExternalProgramsService._progFile(`Comport_SeedKeyDLL_Client.exe`)
        const dlls_lib_folder = ExternalProgramsService._progFile(`keygen_dlls`)
        const args = [
            exeAppFilename,
            "start-server",
            port.toString(),
            dlls_lib_folder,
        ]
        while(true){
            try {
                await spawn('wine', args, {}, (stdout, stderr) => {
                    if(stdout){
                        stdout.split('\n')
                        .filter(ln => !!ln)
                        .forEach(ln => console.log('[DLLSeekKeyServer][STDOUT] ' + ln))
                    }else if(stderr){
                        stderr.split('\n')
                        .filter(ln => !!ln)
                        .forEach(ln => console.log('[DLLSeekKeyServer][STDERR] ' + ln))
                    }
                })
            } catch (error) {
                console.error(error)
                console.error('Comport_SeedKeyDLL Server Exited, Restarting it in 1 second.')
            }
            await sleep(1000)
        }
    }

    /**
     * 
     * @param {string} dllName 
     * @param {string} seed 
     * @param {string | number} accessLevel 
     * @returns {Promise<string>}
     */
    static async GenerateKey(dllName, seed, accessLevel){
        const queryString = `dllName=${dllName}&seed=${seed}&securityAccessLevel=${accessLevel.toString()}`
        const response = await axios.post(`http://localhost:${this.HTTP_SERVER_PORT}?${queryString}`)
        const { GeneratedKey } = response.data
        return GeneratedKey
    }

}

module.exports = {
    DLLSeekKeyServer
}