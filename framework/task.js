class Task{

    /**
     * @protected
     * @type {typeof import('../central').Central}
     */
    Central = null;

    /**
     * @param {typeof import('../central').Central} Central 
     */
    constructor(Central){
        this.Central = Central
    }

    /**
     * @public
     */
    async Init(){
        
    }


}

module.exports = {
    Task
}