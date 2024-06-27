const md5 = require("md5")
const { coll } = require('../../db')

class ComportDebugService{

    static async AddException(appName, exceptionDto, payload){
        const { UserDetails } = payload || {}
        const { ExceptionType, FullStackTrace, ExceptionString } = exceptionDto
        const { ExceptionHeader, ExceptionHash } = this.GetAdditionalExceptionAttributes(exceptionDto)
        const exColl = coll('exceptions', appName)
        await exColl.updateOne(
            { ExceptionHash: ExceptionHash },
            {
                $set: {
                    ExceptionHash: ExceptionHash,
                    ExceptionHeader: ExceptionHeader,
                    ExceptionType: ExceptionType,
                    FullStackTrace: FullStackTrace,
                    LastOccurrenceDate: new Date(),
                    Archived: false
                },
                $push: {
                    ExceptionsList: {
                        ExceptionString,
                        UserDetails
                    }
                },
                $inc: { Count: 1 }
            },
            { upsert: true }
        )
        return {
            ExceptionHash
        }
    }

    static GetAdditionalExceptionAttributes(exceptionDto){
        const { ExceptionType, FullStackTrace, ExceptionString } = exceptionDto
        const ExceptionHeader = ExceptionString.split('\n', 1)[0].trim()
        const ExceptionHash = md5([ExceptionType, ExceptionHeader].concat(FullStackTrace).join('\n'))
        return {
            ExceptionHeader,
            ExceptionHash
        }
    }

}

module.exports = {
    ComportDebugService
}