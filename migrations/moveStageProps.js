const { coll, client } = require('../db')
const { ObjectId } = require('mongodb')

const customers = coll('comport', 'users')

async function migrate(){
    const users = await customers.find().toArray()
    const queries = []
    for(let user of users){
        const { stage_1, stage_2 } = user
        const enabled_tunes = {
            stage_1, stage_2,
            burble: true,
            octane_91: true,
            octane_93: true
        }
        queries.push(customers.updateOne({ _id: ObjectId(user._id) }, {
            $set: {
                enabled_tunes
            },
            $unset: {
                stage_1: '',
                stage_2: ''
            }
        }))
    }
    await Promise.all(queries)
}

client.connect()
.then(() => migrate())
.then(() => console.log('migration completed.'))
.then(() => process.exit(0))