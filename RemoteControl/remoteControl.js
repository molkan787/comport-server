const { Server: SocketServer, Socket } = require("socket.io");
const { validateStrings } = require('../utils')
const { GetCustomerIdByEmailVin } = require('../services/customers')

const CMDS = Object.freeze({
    SubscribeToSlaveState: 'subscribe-to-slave-state',
    UnsubscribeFromSlaveState: 'unsubscribe-from-slave-state',
    TakeControl: 'take-control',
    ReleaseControl: 'release-control',
    Update: 'update',
    ToSlave: 'to-slave',
    Response: 'response',
    Do: 'do'
})

module.exports = class RemoteControlService{

    /** @type {Map<string, Socket>} Customers */
    static Customers = new Map()

    /** @type {Map<string, Socket>} Admins */
    static Admins = new Map()

    /** @type {Map<string, string>} Customers */
    static UpdatesRedirections = new Map()

    static SetUpdateRedirection = (customerId, action, adminId) => this.UpdatesRedirections.set(`${customerId}:${action}`, adminId)
    static RemoveUpdateRedirection = (customerId, action) => this.UpdatesRedirections.delete(`${customerId}:${action}`, adminId)
    static GetUpdateRedirection = (customerId, action) => this.UpdatesRedirections.get(`${customerId}:${action}`)
    static GetUpdateRedirectionSocket = (customerId, action) => this.Admins.get(this.GetUpdateRedirection(customerId, action))

    /** @param {SocketServer} IOServer */
    static Init(IOServer){
        this.server = IOServer;
        IOServer.on('connection', socket => this.GotNewClient(socket));
        
    }

    /** @param {Socket} socket */
    static async GotNewClient(socket){
        const { headers } = socket.request
        const clientType = headers['client-type']
        let accepted = false
        if(clientType === 'admin'){
            accepted = await this.GotNewAdmin(socket)
        }else if(clientType === 'customer'){
            accepted = await this.GotNewCustomer(socket)
        }
        if(!accepted){
            socket.disconnect()
        }
    }

    /** @param {Socket} socket */
    static async GotNewAdmin(socket){
        const clientId = socket.request.headers['client-id'];
        if(!validateStrings(clientId)) return false
        // TODO: check the authorization
        this.StoreAdmin(clientId, socket)
        return true
    }

    /**
     * @param {string} adminId 
     * @param {Socket} socket 
     */
     static StoreAdmin(adminId, socket){
        // disconnect the socket if there was already one for the same user
        const soc = this.Admins.get(adminId)
        if(!!soc) soc.disconnect(true)

        // store the admin's socket in the index
        socket.adminId = adminId
        this.Admins.set(adminId, socket)
        
        socket.on(CMDS.TakeControl, (customerId, callback) => this.AdminOnReq_TakeControl(adminId, customerId, callback))

        socket.on(CMDS.ToSlave, (customerId, ...args) => this.AdminOnReq_ToSlave(adminId, customerId, ...args))

        socket.on(CMDS.ReleaseControl, (customerId, callback) => this.AdminOnReq_ReleaseControl(admin, customerId, callback))

        socket.on(CMDS.SubscribeToSlaveState, (customerId, callback) => this.AdminOnReq_SubscribeToSlaveState(adminId, customerId, callback))
                    
        socket.on(CMDS.UnsubscribeFromSlaveState, (customerId, callback) => this.AdminOnReq_UnsubscribeFromSlaveState(adminId, customerId, callback))
    }

    /** @param {Socket} socket */
    static async GotNewCustomer(socket){
        const clientId = socket.request.headers['client-id'];
        if(!validateStrings(clientId)) return false
        const customerId = clientId
        this.StoreCustomer(customerId, socket)
        this.EmitCustomerUpdates(customerId, 'state', 'connected')
        return true
    }

    /**
     * @param {string} customerId 
     * @param {Socket} socket 
     */
     static StoreCustomer(customerId, socket){
        // disconnect the socket if there was already one for the same customer
        const soc = this.Customers.get(customerId)
        if(!!soc) soc.disconnect(true)

        // store the customer's socket in the index
        socket.customerId = customerId
        socket.on('disconnect', () => this.CustomerDisconnected(socket))
        socket.on(CMDS.Response, (subaction, ...args) => this.CustomerOnReq_Response(customerId, subaction, ...args))
        this.Customers.set(customerId, socket)
    }

    /**
     * @param {Socket} socket 
     */
    static CustomerDisconnected(socket){
        const soc = this.Customers.get(socket.customerId)
        if(soc.id == socket.id){
            this.Customers.delete(socket.customerId)
        }
        this.EmitCustomerUpdates(socket.customerId, 'state', 'disconnected')
    }

    /**
     * @param {string} customerId 
     * @param {string} action 
     * @param {any} payload 
     */
    static EmitCustomerUpdates(customerId, action, ...args){
        const upso = this.GetUpdateRedirectionSocket(customerId, action)
        if(!!upso){
            upso.emit(CMDS.Update, customerId, action, ...args)
        }
    }

    // -------------------- Actual Remote Control Logic --------------------

    static AdminOnReq_SubscribeToSlaveState(adminId, customerId, callback){
        this.SetUpdateRedirection(customerId, 'state', adminId)
        callback(true)
    }
    
    static AdminOnReq_UnsubscribeFromSlaveState(adminId, customerId, callback){
        if(this.GetUpdateRedirection(customerId, 'state') === adminId){
            this.RemoveUpdateRedirection(customerId, 'state')
        }
        callback(true)
    }

    static AdminOnReq_TakeControl(adminId, customerId, callback){
        const soc = this.Customers.get(customerId)
        if(!soc){
            callback({
                status: 'failed',
                reason: 'Customer is not connected'
            })
            return
        }
        this.SetUpdateRedirection(customerId, 'state', adminId)
        this.SetUpdateRedirection(customerId, CMDS.Response, adminId)
        soc.emit(CMDS.TakeControl, callback)
    }

    static AdminOnReq_ReleaseControl(adminId, customerId, callback){
        // Clear updates redirection
        const keys = Array.from(this.UpdatesRedirections.keys()).filter(k => k.startsWith(customerId + ':'))
        for(let k of keys){
            const action = k.split(':')[1]
            const _adminId = this.GetUpdateRedirection(customerId, action)
            if(adminId === _adminId){
                this.RemoveUpdateRedirection(customerId, action)
            }
        }

        // notify the customer that the control was released
        const soc = this.Customers.get(customerId)
        if(!!soc){
            soc.send(CMDS.ReleaseControl)
            callback(true)
        }else{
            callback(false)
        }
    }

    static AdminOnReq_ToSlave(adminId, customerId, ...args){
        const soc = this.Customers.get(customerId)
        if(!!soc){
            soc.emit(CMDS.Do, ...args)
        }else{
            const cb = args[args.length - 1]
            if(typeof cb == 'function'){
                cb(null)
            }
        }
    }

    static CustomerOnReq_Response(customerId, subaction, ...args){
        this.EmitCustomerUpdates(customerId, CMDS.Response, subaction, ...args)
    }

    // ---------------------------------------------------------------------

}