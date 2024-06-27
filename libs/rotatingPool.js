const { EventEmitter } = require("eventemitter3")

/** @template {T} */
class RotatingPool extends EventEmitter{

    /**
     * @private
     * @type {T[]}
     */
    _items

    /**
     * @private
     * @type {number}
     */
    _currentIndex

    /**
     * @private
     * @type {Date}
     */
    _lastChangeTime

    /**
     * @private
     * @type {number}
     */
    _timeWindow

    get currentIndex() { return this._currentIndex }
    get lastChangeTime() { return this._lastChangeTime }

    constructor({ timeWindow }){
        super()
        this._timeWindow = timeWindow
        this._items = []
        this._currentIndex = 0
        this._lastChangeTime = Date.now()
    }

    /**
     * @param {{ items: T[], currentIndex: number, lastChangeTime: number }} payload 
     */
    setup(payload){
        const { items, currentIndex, lastChangeTime } = payload
        this._items = items
        this._currentIndex = currentIndex
        this._lastChangeTime = lastChangeTime
        this.emit('changed')
    }

    getCurrentItem(){
        this.doTasks()
        return this._items[this._currentIndex]
    }

    doTasks(){
        const elapsed = Date.now() - this._lastChangeTime
        if(elapsed > this._timeWindow){
            this._nextIndex()
            this._lastChangeTime = Date.now()
            this.emit('changed')
        }
    }

    /** @private */
    _nextIndex(){
        this._currentIndex++
        if(this._currentIndex >= this._items.length){ // wrap the index
            this._currentIndex = 0
        }
    }

}

module.exports = {
    RotatingPool
}