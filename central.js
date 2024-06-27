const EventEmitter = require('eventemitter3')

class CentralTemplate extends EventEmitter{

}

module.exports = {
    CentralTemplate: CentralTemplate,
    Central: new CentralTemplate()
}