const ERR_TYPE = 'UserError';

module.exports = class UserError extends Error{

    get IsUserError() { return true }
    get ErrType() { return this.__errType }
    __errType = ''
    ErrorCode = -1
    HttpResponseCode = 0

    constructor(message, errorCode, errType){
        super(message)
        this.ErrorCode = errorCode || -1
        this.__errType = errType || ERR_TYPE
    }

    static ItIs(err){
        return err.ErrType === ERR_TYPE
    }

}