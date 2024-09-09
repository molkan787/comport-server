const { getFirstBuffersDiff } = require("../../helpers/data-helpers")
const ExternalProgramsService = require("../externalPrograms")

class CRCHackService{

    static async PatchData(data, options){
        return await ExternalProgramsService.bufferThruFS(
            data,
            (inFile, outFile) => ExternalProgramsService.crchack(
                inFile, outFile, options
            )
        )
    }

    static async GetPatchCorrection(data, options){
        const output = await ExternalProgramsService.bufferThruFS(
            data,
            (inFile, outFile) => ExternalProgramsService.crchack(
                inFile, outFile, options
            )
        )
        const correction = getFirstBuffersDiff(data, output)
        return correction
    }

}


module.exports = {
    CRCHackService,
}