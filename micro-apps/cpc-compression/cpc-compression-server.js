const axios = require('axios')
const ExternalProgramsService = require('../../services/externalPrograms')
const { sleep, spawn } = require('../../utils')

class CPCCompressionServer{

    static HTTP_SERVER_PORT = -1
    
    /**
     * @param {import('../../typings/MicroApps').AppInitOptions} options 
     */
    static async Init(options){
        this.HTTP_SERVER_PORT = options._PortsConfig._PortBase + 733
        this.runServer(this.HTTP_SERVER_PORT)
    }

    static async CompressFile(inputFilename, outputFilename){
        const baseUrl = `http://localhost:${this.HTTP_SERVER_PORT}`
        const qs = `?input=${inputFilename}&output=${outputFilename}`
        const uri = `${baseUrl}/${qs}`
        const response = await axios.post(uri)
        return response.data
    }

    /**
     * @param {number} port 
     */
    static async runServer(port){
        const exeAppFilename = ExternalProgramsService._progFile(`cpc_compression.exe`)
        const args = [
            exeAppFilename,
            "start-http-server",
            port.toString(),
        ]
        while(true){
            try {
                await spawn('wine', args, {}, (stdout, stderr) => {
                    if(stdout){
                        stdout.split('\n')
                        .filter(ln => !!ln)
                        .forEach(ln => console.log('[CPCCompressionServer][STDOUT] ' + ln))
                    }else if(stderr){
                        stderr.split('\n')
                        .filter(ln => !!ln && !ln.includes(':fixme:'))
                        .forEach(ln => console.log('[CPCCompressionServer][STDERR] ' + ln))
                    }
                })
            } catch (error) {
                console.error(error)
                console.error('CPCCompressionServer Server Exited, Restarting it in 1 second.')
            }
            await sleep(1000)
        }
    }

}

module.exports = {
    CPCCompressionServer
}