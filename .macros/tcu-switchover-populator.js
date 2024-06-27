const { Central } = require('../central')
const { GetCustomers } = require('../services/customers')
const { TcuSwitchoverPopulator, MICRO_NAME } = require('../tasks/tcu-switchover-populator')
const { sleep } = require('../utils')

async function run(){
    const tsp = new TcuSwitchoverPopulator(Central)
    const allCustomer = await GetCustomers()
    const len = allCustomer.length
    console.log('Total Customers: ' + len)
    const eligibleCustomers = []
    for(let i = 0; i < len; i++){
        const customer = allCustomer[i]
        if(tsp.IsCustomerEligible(customer)){
            eligibleCustomers.push(customer)
        }
    }
    const len2 = eligibleCustomers.length
    console.log('Total Eligible Customers: ' + len2)
    for(let i = 0; i < len2; i++){
        const customer = eligibleCustomers[i]
        tsp.PopulateTcuSwitchover({ customer: customer })
        await sleep(5000) // need to update so we don't use obdlabs api too frequently
        console.log(`Completed: ${i + 1}/${len2}`)
    }
    console.log('Finished populating Switchovers!')
}

module.exports = {
    run
}