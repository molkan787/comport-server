const createMockHttpResponseObject = () => {
    return {
        status(status){
            this.$status = status
        },
        send(data){
            this.$data = data
        }
    }
}

module.exports = {
    createMockHttpResponseObject
}