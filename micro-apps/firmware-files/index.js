
/**
 * @param {import('../../typings/MicroApps').AppInitOptions} options 
 */
async function Init(options){
    await TunesFilesService.Init(options.db.client)
}

module.exports = {
    Init
}