module.exports = class AuthError extends Error{

    constructor(message, errorCode){
        super(message)
        this.errorCode = errorCode || 'auth_error'
    }

    get isAuthError(){
        return true
    }

}