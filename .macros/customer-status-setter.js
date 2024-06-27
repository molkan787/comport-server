const { client, coll } = require('../db')
const { CUSTOMER_STATUS } = require('../services/customers')

async function run(){
    await client.connect()
    await coll('comport', 'users').updateMany(
        {},
        {
            $set: {
                status: CUSTOMER_STATUS.Active
            }
        }
    )   
}


run()
.then(() => console.log('Task Completed!'))
.catch(err => console.error(err))
.finally(() => process.exit())