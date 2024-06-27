const InvalidInputError = require('../framework/errors/InvalidInputError')
const mkdirp = require('mkdirp')
const path = require('path')
const { writeFile, readFile, listDirectoryFiles, fileExists, deleteFile } = require('../utils')

module.exports = class UserLogsService{

    /**
     * @param {string} userId 
     * @param {string[]} logs 
     * @returns {Promise<void>}
     */
    static async AddLogs(userId, logs){
        if(typeof userId !== 'string' || userId.length === 0)
            throw new InvalidInputError('Missing or invalid paramater `userId`')
        if(!Array.isArray(logs) || logs.length == 0)
            throw new InvalidInputError('Invalid input paramater `logs`')

        const userlogsDir = await this._PrepareLogsDir(userId)
        const sortKey = this._GetLogItemDateKey(logs[0])
        
        const logsJson = JSON.stringify(logs)
        const logsFilepath = path.join(userlogsDir, sortKey)
        await writeFile(logsFilepath, logsJson)
    }

    static _GetLogItemDateKey(rawlog){
        const bin = Buffer.from(rawlog, 'base64')
        const dateBytes = bin.slice(0, 8)
        dateBytes.reverse()
        return dateBytes.toString('hex')
    }

    static async _PrepareLogsDir(userId){
        const userLogsDir = this._GetUserLogsDirPath(userId)
        await mkdirp(userLogsDir)
        return userLogsDir
    }

    static _GetUserLogsDirPath(userId){
        return path.join(__dirname, '..', '..', 'storage', 'userlogs', userId.toString())
    }

    static async ClearLogs(userId){
        const userlogsDir = this._GetUserLogsDirPath(userId)
        const files = await listDirectoryFiles(userlogsDir)
        await Promise.all(
            files.map(f => deleteFile(path.join(userlogsDir, f)))
        )
        return true
    }

    static async GetLogs(userId, groupsCount, after){
        const count = typeof groupsCount == 'number' ? groupsCount : 1
        const userLogsDir = this._GetUserLogsDirPath(userId)
        const dirExists = await fileExists(userLogsDir)
        if(!dirExists){
            return {
                items: [],
                lastGroupKey: null
            }
        }
        const allGroups = await listDirectoryFiles(userLogsDir)
        const sorted = allGroups.sort().reverse()
        const startIdex = typeof after == 'string' ? (sorted.indexOf(after) + 1) : 0
        const groupsNames = sorted.slice(startIdex, startIdex + count)
        const rawGroups = await Promise.all(
            groupsNames.map(n => readFile(path.join(userLogsDir, n), 'utf8'))
        )
        const itemsGroups = rawGroups.map(r => this.SplitRawGroupItems(r))
        const logs = [].concat.apply([], itemsGroups);
        return {
            items: logs,
            lastGroupKey: groupsNames[groupsNames.length - 1] || null
        }
    }

    /**
     * @param {string} rawData 
     * @returns {string[]}
     */
    static SplitRawGroupItems(rawData){
        if(rawData.charAt(0) === '['){
            return JSON.parse(rawData).reverse()
        }else{
            return rawData.split('\n')
        }
    }

}