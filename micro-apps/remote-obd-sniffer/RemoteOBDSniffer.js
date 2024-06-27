const NoPermissionError = require('../../framework/errors/NoPermissionError')
const { WrapRouteHandler } = require('../../helpers/controller-helpers')
const { ValidateParams } = require('../../helpers/inputValidation')

class RemoteOBDSniffer{

    /** @param {import('express').Express} app */
    static Init(app, { coll }){
        this.recordingsCollection = coll('remote_obd_sniffer', 'recordings')
        this.dataCollection = coll('remote_obd_sniffer', 'recordings_data')
        app.post(
            '/remote_obd_sniffer/push-recording-items',
            (req, res) => this.RouteHandler_PushRecordingItems(req, res)
        )
    }

    static async RouteHandler_PushRecordingItems(req, res){
        return await WrapRouteHandler(req, res,
            () => ValidateParams(
                res, { token: req.query.token, items: (req.body || {}).items },
                { token: 'NoneEmptyString', items: 'Array' }
            ),
            async () => {
                const valid = await this.CheckInviteToken(req.query.token)
                if(!valid) return { status: 'error', error: 'Invalid Invite Token' }
                await this.PushRecordingItems(req.query.token, req.body.items)
                return { status: 'ok' }
            }
        )
    }

    /**
     * @param {string} token 
     */
    static async CheckInviteToken(token){
        try {
            const doc = await this.recordingsCollection.findOne({ uid: token })
            return !!doc
        } catch (error) {
            console.error(error)
            return false
        }
    }

    static async PushRecordingItems(inviteToken, data){
        if(data.length < 1) return
        const items = data.map(({ time, dir, bytes }) => {
            const item = { time, dir, bytes }
            if(typeof bytes === 'string'){
                item.bytes = Buffer.from(bytes, 'base64')
            }
            return item
        })
        await this.dataCollection.updateOne(
            { uid: inviteToken },
            {
                $set: { uid: inviteToken  },
                $push: {
                    items: { $each: items }
                }
            },
            { upsert: true }
        )
    }
}

module.exports = {
    RemoteOBDSniffer
}