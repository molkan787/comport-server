const InvalidInputError = require('../framework/errors/InvalidInputError')
const LZRBService = require('../services/lzrb')
const SecurityAlgorithmsService = require('../services/securityAlgorithms')
const KvsService = require('../services/kvs')
const { getRequestRawBody, validateStrings } = require('../utils')
const CRC32PatcherService = require('../services/crc32patcher')
const ExternalProgramsService = require('../services/externalPrograms')
const CRCManipTool = require('../services/tools/CRCManipTool')
const { MG1CryptoTool } = require('../services/tools/MG1CryptoTool')
const { IsValidString } = require('../jsutils')
const { MG1CS002_AT } = require('../services/tools/MG1CS002_AT')
const { AuthenticateCustomerFromQuery } = require('../services/customers')
const { DLLSeekKeyServer } = require('../micro-apps/dll-seedkey/dll-seedkey-server')
const { CPCCompressionServer } = require('../micro-apps/cpc-compression/cpc-compression-server')

module.exports = class ToolsController{

    /**
     * @type {{[toolName: string]: (req, res) => Promise<any>}}
     */
    static Tools = {
        'lzrb-compress': this.t_LzrbCompress,
        'lzrb-decompress': this.t_LzrbDecompress,
        'powertrainalgo-generatekey': this.t_PowertrainAlgo_GenerateKey,
        'daimlerstandardalgo-generatekey': this.t_DaimlerStandardAlgo_GenerateKey,
        'MG1CS002_SA-generatekey': this.t_MG1CS002_SA_GenerateKey,
        'SA2-generatekey': this.t_SA2_GenerateKey,
        'crc32-patch': this.t_CRC32Patch,
        'vw-checksum-fix': this.t_VWChecksumFix,
        'simos18-lzss': this.t_Simos18LZSS,
        'nissan-keygen': this.t_Nissan_GenerateKey,
        'crc-manip': this.t_CRCManip,
        'subaru-generatekey': this.t_Subaru_GenerateKey,
        'subaru-encrypt': this.t_Subaru_Encrypt,
        'mg1-encrypt': this.t_MG1Encrypt,
        'med1775am-generatekey': this.t_MED1775AM_GenerateKey,
        'med1775_17_29_01_2017201707-generatekey': this.t_MED1775_17_29_01_201720170_GenerateKey,
        'med40_12_17_00_20181109051126-generatekey': this.t_MED40_12_17_00_20181109051126_GenerateKey,
        'med177_multi_14_04_01_20193022103018-generatekey': this.t_med177_multi_14_04_01_20193022103018_GenerateKey,
        'infintiMed40_2749001500-generatekey': this.t_infintiMed40_2749001500_GenerateKey,
        'MED40_18_43_01_201802260802-generatekey': this.t_GenericSecAlgo_GenerateKey,
        'MRG1_16_18_11_2018442604441-generatekey': this.t_GenericSecAlgo_GenerateKey,
        'ME97_21_37_01_2021060709065-generatekey': this.t_GenericSecAlgo_GenerateKey,
        'ME97_21_48_05_2021050301054-generatekey': this.t_GenericSecAlgo_GenerateKey,
        'EZS213_18_13_02_20182930072-generatekey': this.t_GenericSecAlgo_GenerateKey,
        'EZS167_18_13_01_20182626032-generatekey': this.t_GenericSecAlgo_GenerateKey,
        'EZS167_18_19_59_20181830011-generatekey': this.t_GenericSecAlgo_GenerateKey,
        'MG1CS002_AT_PatchBlocksData': this.t_MG1CS002_AT_PatchBlocksData,
        "dll-generatekey": this.t_GenericSecAlgoDLL_GenerateKey,
        'cpc-compress': this.t_CPCCompress,
        "unlockecu-generatekey": this.t_UnlockECU_GenerateKey,
        "crchack": this.t_CRCHack,
    }

    static async handleRequest(req, res){
        
        // TODO: Uncomment this
        // const customerAuthenticated = await AuthenticateCustomerFromQuery(req, res)
        // if(!customerAuthenticated){
        //     return
        // }

        try {
            const tool = this.Tools[req.params.tool]
            if(typeof tool != 'function'){
                res.status(400).send('Unknow tool')
                return
            }
            let response = await tool(req, res)

            if(response !== undefined){
                if(Buffer.isBuffer(response)){
                    res.setHeader('content-type', 'application/octet-stream')
                    res.setHeader('content-length', response.length)
                    res.send(response)
                }else{
                    res.send(response)
                }
            }else{
                console.log('Tools Controller: No response to send back.')
                res.status(500).send('Unknow error')
            }
        } catch (error) {
            if(InvalidInputError.ItIs(error)){
                res.status(400).send(error.message)
            }else{
                console.error(error)
                res.status(500).send('Internal server error')
            }
        }
    }

    static async t_LzrbCompress(req, res){
        const data = await getRequestRawBody(req)
        const compressedData = await LZRBService.Compress(data)
        return compressedData
    }

    static async t_LzrbDecompress(req, res){
        const data = await getRequestRawBody(req)
        const decompressData = await LZRBService.Decompress(data)
        return decompressData
    }

    static async t_CPCCompress(req, res){
        const data = await getRequestRawBody(req)
        const compressedData = await ExternalProgramsService.bufferThruFS(
            data,
            (_in, out) => CPCCompressionServer.CompressFile(_in, out)
        )
        return compressedData
    }

    static async t_PowertrainAlgo_GenerateKey(req, res){
        const { seed, securityAccessLevel } = req.query
        const key = await SecurityAlgorithmsService.PowertrainAlgo_GenerateKey(seed, parseInt(securityAccessLevel))
        return {
            GeneratedKey: key.toString('hex')
        }
    }
    
    static async t_DaimlerStandardAlgo_GenerateKey(req, res){
        const { seed, securityAccessLevel } = req.query
        const key = await SecurityAlgorithmsService.DaimlerStandardAlgo_GenerateKey(seed, parseInt(securityAccessLevel))
        return {
            GeneratedKey: key.toString('hex')
        }
    }
    
    static async t_MG1CS002_SA_GenerateKey(req, res){
        const { seed } = req.query
        const key = await SecurityAlgorithmsService.MG1CS002_SA_GenerateKey(seed)
        return {
            GeneratedKey: key.toString('hex')
        }
    }
    
    static async t_Nissan_GenerateKey(req, res){
        let { algo, seed, scode } = req.query
        scode = parseInt(scode)
        if(algo !== 'gen1' && algo !== 'gen2')
            throw new InvalidInputError('Unknow algorithm')
        if(typeof seed != 'string' || seed.length != 8)
            throw new InvalidInputError('Invalid input seed')
        if(algo == 'gen1' && isNaN(scode))
            throw new InvalidInputError('A valid scode paramter is requried when using gen1 algorithm')

        const key = await SecurityAlgorithmsService.Nissan_GenerateKey(algo, seed, scode)
        return {
            GeneratedKey: key.toString('hex')
        }
    }

    static async t_SA2_GenerateKey(req, res){
        const { seed, instructionTape, microModel } = req.query
        const useLocalIT = validateStrings(microModel) && !validateStrings(instructionTape)
        let instructionTapeForUse
        if(useLocalIT){
            const lit = await KvsService.GetValue('sa2_instructions_tape', microModel.toUpperCase())
            if(!lit) throw new Error(`Instruction tape for ${microModel} not found.`)
            instructionTapeForUse = lit
        }else{
            instructionTapeForUse = instructionTape
        }
        const key = await SecurityAlgorithmsService.SA2_GenerateKey(instructionTapeForUse, seed)
        return {
            GeneratedKey: key.toString('hex')
        }
    }

    static async t_CRC32Patch(req, res){
        const data = await getRequestRawBody(req)
        const options = JSON.parse(req.query.options)
        const patchedData = await CRC32PatcherService.Patch(data, options)
        return patchedData
    }

    static async t_VWChecksumFix(req, res){
        const { microModel, blockNumber } = JSON.parse(req.query.options)
        const result = await ExternalProgramsService.bufferToTempFile(req.body,
            (tmpFile) => ExternalProgramsService.VWChecksumFix({
                moduleName: microModel,
                blockNumber: blockNumber,
                inputFilename: tmpFile
            })
        )
        return result
    }

    static async t_Simos18LZSS(req, res){
        const { operation, pad, exactPad } = req.query
        if(operation != 'compress' && operation != 'decompress')
            throw new InvalidInputError('Invalid operation specified', 'unknow_operation')
        const addPadding = pad == 'true' || pad == '1'
        const exactPadding = exactPad == 'true' || exactPad == '1'
        const output = await ExternalProgramsService.bufferThruFS(req.body, async (inFile, outFile) => {
            await ExternalProgramsService.Simos18LZSS({
                operation: operation,
                addPadding: addPadding,
                exactPadding: exactPadding
            }, inFile, outFile)
        })
        return output
    }

    static async t_CRCManip(req, res){
        const { algorithm, targetChecksum, patchOffset } = req.query
        if(!CRCManipTool.SupportedAlgorithms.includes(algorithm)){
            throw new InvalidInputError(`Algorithm '${algorithm}' is not supported`)
        }
        const output = await CRCManipTool.FixChecksum({
            algorithm: algorithm,
            targetChecksum: targetChecksum,
            patchOffset: parseInt(patchOffset),
            data: req.body
        })
        return output
    }
    
    static async t_Subaru_GenerateKey(req, res){
        const { seed } = req.query
        const key = await SecurityAlgorithmsService.Subaru_GenerateKey(seed)
        return {
            GeneratedKey: key.toString('hex')
        }
    }
    
    static async t_Subaru_Encrypt(req, res){
        const { data } = req.query
        const key = await SecurityAlgorithmsService.Subaru_Encrypt(data)
        return {
            GeneratedData: key.toString('hex')
        }
    }

    static async t_MG1Encrypt(req, res){
        const { softwareNumber } = req.query
        if(!IsValidString(softwareNumber)){
            throw new InvalidInputError('Missing software number')
        }
        if(!Buffer.isBuffer(req.body)){
            throw new InvalidInputError('Invalid or missing input binary data.')
        }
        return MG1CryptoTool.EncryptDefaultConfig(req.body, { softwareNumber })
    }

    static async t_MED1775AM_GenerateKey(req, res){
        const { seed } = req.query
        const key = await SecurityAlgorithmsService.MED1775AM_GenerateKey(seed)
        return {
            GeneratedKey: key.toString('hex')
        }
    }

    static async t_MED1775_17_29_01_201720170_GenerateKey(req, res){
        const { seed, securityAccessLevel } = req.query
        const key = await SecurityAlgorithmsService.MED1775_17_29_01_2017201707_GenerateKey(seed, parseInt(securityAccessLevel))
        return {
            GeneratedKey: key.toString('hex')
        }
    }

    static async t_MED40_12_17_00_20181109051126_GenerateKey(req, res){
        const { seed, securityAccessLevel } = req.query
        const key = await SecurityAlgorithmsService.MED40_12_17_00_20181109051126_GenerateKey(seed, parseInt(securityAccessLevel))
        return {
            GeneratedKey: key.toString('hex')
        }
    }

    static async t_med177_multi_14_04_01_20193022103018_GenerateKey(req, res){
        const { seed, securityAccessLevel } = req.query
        const key = await SecurityAlgorithmsService.med177_multi_14_04_01_20193022103018_GenerateKey(seed, parseInt(securityAccessLevel))
        return {
            GeneratedKey: key.toString('hex')
        }
    }

    static async t_infintiMed40_2749001500_GenerateKey(req, res){
        const { seed } = req.query
        const key = await SecurityAlgorithmsService.infintiMed40_2749001500_GenerateKey(seed)
        return {
            GeneratedKey: key.toString('hex')
        }
    }
    
    static async t_GenericSecAlgo_GenerateKey(req, res){
        const { seed, securityAccessLevel } = req.query
        const jarFilename = req.params.tool.split('-')[0]
        const key = await SecurityAlgorithmsService.GenericSecAlgoJarExec({
            jarFilename: `SecAlgo_${jarFilename}`,
            seed: seed,
            secLevel: securityAccessLevel
        })
        return {
            GeneratedKey: key.toString('hex')
        }
    }
    
    static async t_GenericSecAlgoDLL_GenerateKey(req, res){
        const { dllName, seed, securityAccessLevel } = req.query
        const key = await DLLSeekKeyServer.GenerateKey(dllName, seed, securityAccessLevel)
        return {
            GeneratedKey: key
        }
    }

    static async t_MG1CS002_AT_PatchBlocksData(req, res){
        const { blockNumber } = req.query
        if(!IsValidString(blockNumber)) throw new InvalidInputError('Missing Block Number parameter.')
        const blockData = await getRequestRawBody(req)
        const bdNo = parseInt(blockNumber.toString())
        const payload = { [`bd${bdNo}`]: blockData }
        await MG1CS002_AT.PatchBlocksData(payload)
        return blockData
    }
    
    static async t_UnlockECU_GenerateKey(req, res){
        const { ecuName, seed, securityAccessLevel } = req.query
        const key = await SecurityAlgorithmsService.UnlockECU({
            ecuName: ecuName,
            seed: seed,
            secLevel: securityAccessLevel
        })
        return {
            GeneratedKey: key.toString('hex')
        }
    }

    static async t_CRCHack(req, res){
        const data = await getRequestRawBody(req)
        const options = req.query
        options.reverseInput = !!options.reverseInput
        options.reverseFinal = !!options.reverseFinal
        const output = await ExternalProgramsService.bufferThruFS(
            data,
            (inFile, outFile) => ExternalProgramsService.crchack(inFile, outFile, options)
        )
        return output
    }

    // TODO: IMPORTANT add seed and sec level sanitization in every external program exec function

}