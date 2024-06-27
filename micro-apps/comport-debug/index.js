const { PostException } = require('./comport-debug-controller')

/**
 * @param {import('../../typings/MicroApps').AppInitOptions} options 
 */
async function Init(options){
    const { app } = options
    app.post('/comport-debug/exception', PostException)
}

module.exports = {
    Init
}