const UserError = require("./UserError");
const ERR_TYPE = 'NotFoundError';

module.exports = class NotFoundError extends UserError{


    constructor(message, errorCode){
        super(message, errorCode, ERR_TYPE)
        this.HttpResponseCode = 404
    }

    static ItIs(err){
        return err.ErrType === ERR_TYPE
    }

}