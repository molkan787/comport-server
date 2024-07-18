const path = require('path')
const temp = require('temp')
const { exec, writeFile, deleteFile, readFile } = require('../utils')

function SanitizeHexSerie(seed){
    return Buffer.from(seed.replace(/\s/g, ''), "hex").toString("hex")
}

function SanitizeHexNumber(num){
    return parseInt(num.toString(), 16).toString(16)
}

function SanitizeNumber(num){
    return parseInt(num.toString(), 10).toString(10)
}

module.exports = class ExternalProgramsService{

    static async lzrb(action, inFilename, outFilename){
        const cmd = `java -jar "${this._progFile('lzrb.jar')}" ${action} "${inFilename}" "${outFilename}"`
        return await exec(cmd)
    }

    static async PowertrainSecurityAlgo(seed, securityAccessLevel){
        const cmd = `java -jar "${this._progFile('PowertrainSecurityAlgo.jar')}" ${SanitizeHexSerie(seed)} ${SanitizeNumber(securityAccessLevel)}`
        return await exec(cmd)
    }
    
    static async DaimlerStandardSecurityAlgo(seed, securityAccessLevel){
        const cmd = `java -jar "${this._progFile('DaimlerStandardSecurityAlgo.jar')}" ${SanitizeHexSerie(seed)} ${SanitizeNumber(securityAccessLevel)}`
        return await exec(cmd)
    }

    static async SA2SeedKeyGeneration(instruction_tape, seed){
        const cmd = `${this.getPythonCmd()} "${this._progFile('sa2_seed_key.py')}" ${SanitizeHexSerie(instruction_tape)} ${SanitizeHexSerie(seed)}`
        return await exec(cmd)
    }

    /**
     * @param {'gen1' | 'gen2'} algo 
     * @param {string} seed A 4 bytes Seed in form of hex string
     * @param {number} scode Required only for 'gen1' algo
     * @returns {Promise<string>}
     */
    static async NissanSeedKeyGeneration(algo, seed, scode){
        const cmd = `"${this._progFile('nissan_seedkey_gen', true)}" ${algo} ${SanitizeHexSerie(seed)} ${SanitizeNumber(scode)}`
        return await exec(cmd)
    }

    /**
     * @param {{moduleName: string, inputFilename: string, blockNumber: number}} parameters 
     * @returns {Promise<{checksum: string, place_offset: number}>}
     */
    static async VWChecksumFix(parameters){
        const encodedParams = JSON.stringify(parameters).replace(/"/g, "\\\"")
        const cmd = `${this.getPythonCmd()} "${this._progFile('vw_flash/checksum_client.py')}" "${encodedParams}"`
        const output = await exec(cmd)
        return this._grabOutputJson(output)
    }

    /**
     * 
     * @param {string} inFilename 
     * @param {string} outFilename 
     * @param {string} targetChecksum 4 bytes in Hex String
     * @param {string} patchOffset int32 number in Hex String
     * @returns 
     */
    static async CRC32Patcher(inFilename, outFilename, targetChecksum, patchOffset){
        const cmd = `"${this._progFile('crc32patcher')}" "${inFilename}" "${outFilename}" ${SanitizeNumber(targetChecksum)} ${SanitizeNumber(patchOffset)}`
        return await exec(cmd)
    }

    /**
     * @param {{ operation: 'compress' | 'decompress', addPadding: boolean, exactPadding: boolean }} parameters 
     * @param {string} inFilename 
     * @param {string} outFilename 
     */
    static async Simos18LZSS(parameters, inFilename, outFilename){
        const { operation, addPadding, exactPadding } = parameters
        let options = operation === 'compress' ? '-c' : '-d'
        if(!addPadding) options += ' -p'
        if(exactPadding) options += ' -e'
        const cmd = `"${this._progFile('lzss_simos18_impl/lzss', true)}" -i "${inFilename}" -o "${outFilename}" ${options}`
        console.log(cmd)
        return await exec(cmd)
    }

    /**
     * @typedef CRCManipOptions
     * @prop {'CRC32' | 'CRC32POSIX' | 'CRC16CCITT' | 'CRC16IBM'} algorithm
     * @prop {string} inputFilename
     * @prop {string} outputFilename
     * @prop {string} targetChecksum
     * @prop {number} patchOffset
     * 
     * @param {CRCManipOptions} options 
     * @returns 
     */
     static async CRCManip(options){
        const { algorithm, inputFilename, outputFilename, targetChecksum, patchOffset } = options
        const cmd = (
            `"${this._progFile('crcmanip-cli', true)}" patch "${inputFilename}" "${outputFilename}" ` +
            `"${SanitizeNumber(targetChecksum)}" --algorithm ${algorithm} --position ${SanitizeNumber(patchOffset).toString()} --overwrite `
        )
        return await exec(cmd)
    }

    /**
     * 
     * @param {'genkey' | 'encrypt'} command 
     * @param {string} data A 4 bytes data in hex string
     * @returns 
     */
    static async SubaruTools(command, data){
        const cmd = `"${this._progFile('subaru_tools', true)}" ${command} ${SanitizeHexSerie(data)}`
        return await exec(cmd)
    }

    static async SecAlgo_MED1775_17_29_01_2017201707(seed, secLevel){
        const cmd = `java -jar "${this._progFile('SecAlgo_MED1775_17_29_01_2017201707.jar')}" ${SanitizeHexSerie(seed)} ${SanitizeNumber(secLevel)}`
        return await exec(cmd)
    }

    static async SecAlgo_MED40_12_17_00_20181109051126(seed, secLevel){
        const cmd = `java -jar "${this._progFile('SecAlgo_MED40_12_17_00_20181109051126.jar')}" ${SanitizeHexSerie(seed)} ${SanitizeNumber(secLevel)}`
        return await exec(cmd)
    }

    static async SecAlgo_med177_multi_14_04_01_20193022103018(seed, secLevel){
        const cmd = `java -jar "${this._progFile('SecAlgo_med177_multi_14_04_01_20193022103018.jar')}" ${SanitizeHexSerie(seed)} ${SanitizeNumber(secLevel)}`
        return await exec(cmd)
    }

    static async SecAlgo_infintiMed40_2749001500(seed){
        const cmd = `${this.getPythonCmd()} "${this._progFile('SecAlgo_infintiMed40_2749001500.py')}" "${SanitizeHexSerie(seed)}"`
        return await exec(cmd)
    }

    static async SecAlgo_infintiMed40_2749001500(seed){
        const cmd = `${this.getPythonCmd()} "${this._progFile('SecAlgo_infintiMed40_2749001500.py')}" "${SanitizeHexSerie(seed)}"`
        return await exec(cmd)
    }

    static async SecAlgo_GenericJar(jarFilename, seed, secLevel){
        const cmd = `java -jar "${this._progFile(`${jarFilename}.jar`)}" ${SanitizeHexSerie(seed)} ${SanitizeNumber(secLevel) || ''}`
        return await exec(cmd)
    }

    static async SecAlgo_GenericDLL(dllName, seed, secLevel){
        const dllFilename = path.join(this._progFile('keygen_dlls'), dllName)
        const cmd = `wine "${this._progFile(`Comport_SeedKeyDLL_Client.exe`)}" "${dllFilename}" ${SanitizeHexSerie(seed)} ${SanitizeNumber(secLevel) || ''}`
        return await exec(cmd)
    }

    // ----------- internal helpers -----------

    /**
     * @private
     * @param {string} sName
     * @param {boolean} addExeExtOnWin Whether to automatically append '.exe' extension when on windows platform (Default: false)
     */
    static _progFile(sName, addExeExtOnWin){
        const fl = path.join(__dirname, '..', 'resources', 'programs', sName)
        if(addExeExtOnWin) return this.exeName(fl)
        else return fl
    }

    /**
     * @private
     * @param {string} output 
     * @returns {Object}
     */
    static _grabOutputJson(output){
        const prefix = 'output:'
        const lines = output.split('\n')
        for(let i = 0; i < lines.length; i++){
            const ln = lines[i].trim()
            if(ln.startsWith(prefix)){
                const rawJson = ln.substring(prefix.length).trim()
                return JSON.parse(rawJson)
            }
        }
        return null
    }

    static getPythonCmd(){
        return process.platform === 'win32' ? 'python' : 'python3.9'
    }

    static get IsWin(){
        return process.platform === 'win32'
    }

    static exeName(baseName){
        return this.IsWin ? (baseName + '.exe') : baseName
    }

    // ----------- internal helpers -----------

    /**
     * @template T
     * @param {Buffer} buffer 
     * @param {(filename: string) => Promise<T>} runner 
     * @returns {Promise<T>}
     */
    static async bufferToTempFile(buffer, runner){
        const tmpFilename = temp.path()
        await writeFile(tmpFilename, buffer)
        const result = await runner(tmpFilename)
        await deleteFile(tmpFilename)
        return result
    }

    /**
     * @param {Buffer} buffer 
     * @param {(inFilename: string, outFilename: string) => Promise<any>} runner 
     * @returns {Promise<Buffer>}
     */
     static async bufferThruFS(buffer, runner){
        const inFilename = temp.path()
        const outFilename = inFilename + '.out'
        await writeFile(inFilename, buffer)
        await runner(inFilename, outFilename)
        const outputBuffer = await readFile(outFilename)
        await Promise.all([
            deleteFile(inFilename),
            deleteFile(outFilename)
        ])
        return outputBuffer
    }

}