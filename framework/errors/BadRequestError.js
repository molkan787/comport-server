const UserError = require("./UserError");
const ERR_TYPE = 'BadRequestError';

module.exports = class BadRequestError extends UserError{


    constructor(message, errorCode){
        super(message, errorCode, ERR_TYPE)
        this.HttpResponseCode = 400
    }

    static ItIs(err){
        return err.ErrType === ERR_TYPE
    }

}