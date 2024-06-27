const { client, coll } = require('./db')
// const { GhostedHttpClient } = require('./core-services/GhostedHttpClient')
// const { sleep } = require('./utils')

async function RunTest(){
    await client.connect()
    // await GhostedHttpClient.Init()
    // for(let i = 0; i < 20; i++){
    //     const axios = GhostedHttpClient.getInstance()
    //     const response = await axios.get('https://api.amrcomport.com:9086/get-my-ip')
    //     console.log('response:', response.data)
    //     await sleep(6000)
    // }

    // // Finding duplicate email
    // const customers = await coll('comport', 'users').find(
    //     {},
    //     { projection: { email: 1, vin: 1 } }
    // ).toArray()
    // const m = new Map()
    // for(let c of customers){
    //     const n = m.get(c.email)
    //     if(typeof n === 'number'){
    //         m.set(c.email, n + 1)
    //     }else {
    //         m.set(c.email, 1)
    //     }
    // }
    // console.table(m.entries())
}




RunTest()
.then(() => console.log('COMPLETED!'))
.catch(e => console.error(e))
.finally(() => process.exit())
