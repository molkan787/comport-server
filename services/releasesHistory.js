const { coll } = require('../db')
const { ArrayToObject } = require('../jsutils')
const rhCollection = coll('metadata', 'releases-history')
const aiCollection = coll('metadata', 'app-info')

module.exports = class ReleasesHistoryService{

    /**
     * @typedef {Object} ReleaseHistoryItem
     * @property {string} appName
     * @property {string} appVersion
     * @property {Date} releaseDate
     */

    /**
     * @param {string} appName 
     * @returns {Promise<ReleaseHistoryItem>}
     */
    static async GetLatestRelease(appName){
        const doc = await rhCollection.findOne(
            { appName: appName },
            {
                sort: {
                    releaseDate: 'desc'
                },
                limit: 1
            }
        )
        if(!doc) return null
        const { appVersion, releaseDate } = doc
        return { appName, appVersion, releaseDate }
    }

    /**
     * @param {string} appName 
     * @param {string} appVersion 
     * @returns {Promise<void>}
     */
    static async PushRelease(appName, appVersion){
        await this.AddHistoryItem({
            appName: appName,
            appVersion: appVersion,
            releaseDate: new Date()
        })
        await this.SetLatestAppVersion(appName, appVersion)
    }

    /**
     * @param {ReleaseHistoryItem} item 
     * @returns {Promise<void>}
     */
    static async AddHistoryItem(item){
        const { appName, appVersion, releaseDate } = item
        const doc = { appName, appVersion, releaseDate }
        await rhCollection.insertOne(doc)
    }

    /**
     * Retrieves obsolete versions of releases (obsolete -> older than one month and not being the latest)
     * @param {Date} maxOld The oldest date to go backward to. Default: 2 months ago
     * @returns {Promise<ReleaseHistoryItem[]>}
     */
    static async GetObsoleteRelease(maxOld){
        let minDate = maxOld
        if(!minDate){
            minDate = new Date()
            minDate.setDate(minDate.getDate() - 60)
        }
        const maxDate = new Date()
        maxDate.setDate(maxDate.getDate() - 30)
        const releases = await this.GetHistoryItemsByDateRange(minDate, maxDate)
        const appsVersions = await this.GetLastestAppsVersions()
        for(let i = releases.length - 1; i >= 0; i--){
            const { appName, appVersion } = releases[i]
            if(appsVersions[appName] == appVersion){
                releases.splice(i , 1)
            }
        }
        return releases
    }

    /**
     * Retrieves release history items (sorted from newest to oldest)
     * @param {number?} count Number of items to retrieve
     * @returns {Promise<ReleaseHistoryItem[]>}
     */
    static async GetHistoryItems(count){
        const docs = await rhCollection.find({}, {
            sort: { releaseDate: 'desc' },
            limit: count || Number.MAX_SAFE_INTEGER
        }).toArray()
        return docs
    }

    /**
     * 
     * @param {Date} minDate 
     * @param {Date} maxDate 
     * @returns {Promise<ReleaseHistoryItem[]>}
     */
    static async GetHistoryItemsByDateRange(minDate, maxDate){
        const docs = await rhCollection.find(
            {
                releaseDate: {
                    $gte: minDate,
                    $lte: maxDate
                }
            },
            {
                sort: { releaseDate: 'desc' }
            }
        ).toArray()
        return docs.map(
            ({ appName, appVersion, releaseDate }) => ({ appName, appVersion, releaseDate })
        )
    }

    /**
     * Sets latest version number of an app in the app info
     * @param {string} appName 
     * @param {string} appVersion 
     */
    static async SetLatestAppVersion(appName, appVersion){
        await aiCollection.updateOne(
            { app: appName },
            {
                $set: {
                    version: appVersion
                }
            }
        )
    }

    /**
     * @public
     * @returns {Promise<{[appName:string]:string}>}
     */
    static async GetLastestAppsVersions(){
        const docs = await aiCollection.find()
        const versions = ArrayToObject(
            docs,
            doc => doc.app,
            doc => doc.version
        )
        return versions
    }

}