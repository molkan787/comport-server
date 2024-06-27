const UserError = require("./UserError");
const ERR_TYPE = 'NoPermissionError';

module.exports = class NoPermissionError extends UserError{

    constructor(message, errorCode){
        super(message, errorCode, ERR_TYPE)
        this.HttpResponseCode = 401
    }

    static ItIs(err){
        return err.ErrType === ERR_TYPE
    }

}