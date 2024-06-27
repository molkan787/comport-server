const { coll, client } = require('../db')
const { ObjectId } = require('mongodb')

const customers = coll('comport', 'users')

async function migrate(){
    const users = await customers.find().toArray()
    const queries = []
    for(let user of users){
        const { last_tune_flash_result, last_tune_flashed, last_tune_flashed_on } = user
        const last_flashing = {
            tune_name: last_tune_flashed,
            result: last_tune_flash_result,
            date: last_tune_flashed_on
        }
        queries.push(customers.updateOne({ _id: ObjectId(user._id) }, {
            $set: {
                last_flashing_ecu: last_flashing
            },
            $unset: {
                last_tune_flash_result: '',
                last_tune_flashed: '',
                last_tune_flashed_on: ''
            }
        }))
    }
    await Promise.all(queries)
}

client.connect()
.then(() => migrate())
.then(() => console.log('migration completed.'))
.then(() => process.exit(0))