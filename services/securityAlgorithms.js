const InvalidInputError = require('../framework/errors/InvalidInputError')
const ExternalProgramsService = require('./externalPrograms')
const { MG1CS002_SA } = require('../algorithms/MG1CS002_SA')
const MED1775AM = require('../algorithms/MED1775AM')

module.exports = class SecurityAlgorithmsService{

    /**
     * @param {Buffer | string} seed 
     * @param {number} securityAccessLevel 
     * @returns {Promise<Buffer>}
     */
    static async PowertrainAlgo_GenerateKey(seed, securityAccessLevel){
        if(Buffer.isBuffer(seed))
            seed = seed.toString('hex')
        if((seed || '').length !== 8)
            throw new InvalidInputError('Invalid seed length, Required length is 4 byte')
        if(securityAccessLevel !== 11 && securityAccessLevel !== 17)
            throw new InvalidInputError('Invalid Security Access Level, One of  11, 17 should be specified')

        const output = await ExternalProgramsService.PowertrainSecurityAlgo(seed, securityAccessLevel)
        const keyHexStr = this._grabOutputData(output)
        return Buffer.from(keyHexStr, 'hex')
    }

    /**
     * @param {Buffer | string} seed 
     * @param {number} securityAccessLevel 
     * @returns {Promise<Buffer>}
     */
     static async DaimlerStandardAlgo_GenerateKey(seed, securityAccessLevel){
        if(Buffer.isBuffer(seed))
            seed = seed.toString('hex')
        if((seed || '').length !== 16)
            throw new InvalidInputError('Invalid seed length, Required length is 8 byte')
        if(securityAccessLevel !== 17)
            throw new InvalidInputError('Invalid Security Access Level, Valid is 17')

        const output = await ExternalProgramsService.DaimlerStandardSecurityAlgo(seed, securityAccessLevel)
        const keyHexStr = this._grabOutputData(output)
        return Buffer.from(keyHexStr, 'hex')
    }

    /**
     * @param {Buffer | string} seed 
     * @returns {Promise<Buffer>}
     */
     static async MG1CS002_SA_GenerateKey(seed){
        if(Buffer.isBuffer(seed))
            seed = seed.toString('hex')
        if((seed || '').length !== 8)
            throw new InvalidInputError('Invalid seed length, Required length is 4 byte')

        const bigIntSeed = BigInt('0x' + seed)
        const bigIntKey = MG1CS002_SA(bigIntSeed)
        const keyHexStr = bigIntKey.toString(16)
        return Buffer.from(keyHexStr, 'hex')
    }

    /**
     * @param {'gen1' | 'gen2'} algo 
     * @param {Buffer | string} seed 
     * @param {number} scode Required only for 'gen1' algo
     * @returns {Promise<Buffer>}
     */
     static async Nissan_GenerateKey(algo, seed, scode){
        if(Buffer.isBuffer(seed))
            seed = seed.toString('hex')
        if((seed || '').length !== 8)
            throw new InvalidInputError('Invalid seed length, Required length is 4 byte')

        const output = await ExternalProgramsService.NissanSeedKeyGeneration(algo, seed, scode)
        console.log('output', output)
        const keyHexStr = this._grabOutputData(output)
        return Buffer.from(keyHexStr, 'hex')
    }

    /**
     * @param {Buffer | string} instructionTape 
     * @param {Buffer | string} seed 
     * @returns {Promise<Buffer>}
     */
     static async SA2_GenerateKey(instructionTape, seed){
        if(Buffer.isBuffer(instructionTape))
            instructionTape = instructionTape.toString('hex')
        if((instructionTape || '').length < 1)
            throw new InvalidInputError('Invalid instructionTape length, Required atleast 1 byte')
        if(Buffer.isBuffer(seed))
            seed = seed.toString('hex')
        if((seed || '').length < 4)
            throw new InvalidInputError('Invalid seed length, Required length is at least 4 byte')

        const output = await ExternalProgramsService.SA2SeedKeyGeneration(instructionTape, seed)
        const keyHexStr = this._grabOutputData(output)
        return Buffer.from(keyHexStr, 'hex')
    }

    /**
     * @param {Buffer | string} seed 
     * @returns {Promise<Buffer>}
     */
     static async Subaru_GenerateKey(seed){
        if(Buffer.isBuffer(seed))
            seed = seed.toString('hex')
        if((seed || '').length != 8)
            throw new InvalidInputError('Invalid seed length, Required length is 4 byte')

        const output = await ExternalProgramsService.SubaruTools('genkey', seed)
        const keyHexStr = this._grabOutputData(output)
        return Buffer.from(keyHexStr, 'hex')
    }
    

    /**
     * @param {Buffer | string} data 
     * @returns {Promise<Buffer>}
     */
     static async Subaru_Encrypt(data){
        if(Buffer.isBuffer(data))
            data = data.toString('hex')
        if((data || '').length != 8)
            throw new InvalidInputError('Invalid data length, Required length is 4 byte')

        const output = await ExternalProgramsService.SubaruTools('encrypt', data)
        const keyHexStr = this._grabOutputData(output, 'Output_Data:')
        return Buffer.from(keyHexStr, 'hex')
    }

    /**
     * @param {Buffer | string} seed 
     * @returns {Promise<Buffer>}
     */
     static async MED1775AM_GenerateKey(seed){
        if(!Buffer.isBuffer(seed))
            seed = Buffer.from(seed, 'hex')
        if(seed.length != 4)
            throw new InvalidInputError('Invalid seed length, Required length is 4 byte')

        return MED1775AM.GenerateKey(seed)
    }
    
    /**
     * @param {Buffer | string} seed 
     * @param {number} securityLevel
     * @returns {Promise<Buffer>}
     */
     static async MED1775_17_29_01_2017201707_GenerateKey(seed, securityLevel){
        if(Buffer.isBuffer(seed))
            seed = seed.toString('hex')
        if(seed.length != 8 && seed.length != 16)
            throw new InvalidInputError('Invalid seed length, Required length is 4 or 8 byte')
        if(![5, 9, 11].includes(securityLevel))
            throw new InvalidInputError('Invalid Security Level');

        const output = await ExternalProgramsService.SecAlgo_MED1775_17_29_01_2017201707(seed, securityLevel)
        const keyHexStr = this._grabOutputData(output)
        return Buffer.from(keyHexStr, 'hex')
    }
      
    /**
     * @param {Buffer | string} seed 
     * @param {number} securityLevel
     * @returns {Promise<Buffer>}
     */
    static async MED40_12_17_00_20181109051126_GenerateKey(seed, securityLevel){
        if(Buffer.isBuffer(seed))
            seed = seed.toString('hex')
        if(seed.length != 8)
            throw new InvalidInputError('Invalid seed length, Required length is 4 byte')
        if(![5, 11].includes(securityLevel))
            throw new InvalidInputError('Invalid Security Level');

        const output = await ExternalProgramsService.SecAlgo_MED40_12_17_00_20181109051126(seed, securityLevel)
        const keyHexStr = this._grabOutputData(output)
        return Buffer.from(keyHexStr, 'hex')
    }
      
    /**
     * @param {Buffer | string} seed 
     * @param {number} securityLevel
     * @returns {Promise<Buffer>}
     */
    static async med177_multi_14_04_01_20193022103018_GenerateKey(seed, securityLevel){
        if(Buffer.isBuffer(seed))
            seed = seed.toString('hex')
        if(seed.length != 16)
            throw new InvalidInputError('Invalid seed length, Required length is 8 byte')
        if(![1, 5, 9].includes(securityLevel))
            throw new InvalidInputError('Invalid Security Level');

        const output = await ExternalProgramsService.SecAlgo_med177_multi_14_04_01_20193022103018(seed, securityLevel)
        const keyHexStr = this._grabOutputData(output)
        return Buffer.from(keyHexStr, 'hex')
    }
    
      
    /**
     * @param {Buffer | string} seed 
     * @returns {Promise<Buffer>}
     */
    static async infintiMed40_2749001500_GenerateKey(seed){
        if(Buffer.isBuffer(seed))
            seed = seed.toString('hex')
        if(seed.length != 16)
            throw new InvalidInputError('Invalid seed length, Required length is 8 byte')

        const output = await ExternalProgramsService.SecAlgo_infintiMed40_2749001500(seed)
        const keyHexStr = this._grabOutputData(output)
        return Buffer.from(keyHexStr, 'hex')
    }

    static async GenericSecAlgoJarExec({ jarFilename, seed, secLevel }){
        if(Buffer.isBuffer(seed))
            seed = seed.toString('hex')
        if(seed.length != 4 && seed.length != 8 && seed.length != 16)
            throw new InvalidInputError('Invalid seed length')

        const output = await ExternalProgramsService.SecAlgo_GenericJar(jarFilename, seed, secLevel)
        const keyHexStr = this._grabOutputData(output)
        return Buffer.from(keyHexStr, 'hex')
    }

    
    static async GenericSecAlgoDLLExec({ dllName, seed, secLevel }){
        if(Buffer.isBuffer(seed))
            seed = seed.toString('hex')
        if(seed.length != 4 && seed.length != 8 && seed.length != 16)
            throw new InvalidInputError('Invalid seed length')

        const output = await ExternalProgramsService.SecAlgo_GenericDLL(dllName, seed, secLevel)
        const keyHexStr = this._grabOutputData(output)
        return Buffer.from(keyHexStr, 'hex')
    }

    // ------------------------------------------------------------------

    /**
     * @param {string} output 
     * @param {string} dataPrefix The string that comes just before the data to return (default = 'Output_key:')
     * @returns {string}
     */
    static _grabOutputData(output, dataPrefix){
        const prefix = dataPrefix || 'Output_key:'
        const lines = output.split('\n')
        for(let i = 0; i < lines.length; i++){
            const ln = lines[i].trim()
            if(ln.startsWith(prefix)){
                const keyHexStr = ln.substring(prefix.length).trim()
                return keyHexStr
            }
        }
        return null
    }

}