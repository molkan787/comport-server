const { coll, client } = require('../db')
const { GetPropValue } = require('../jsutils')
const { toHex, getAscii, writeFile } = require('../utils')

async function run() {
    await client.connect()
    const collection = coll('comport', 'users')
    const customers = await collection.find({ tcu: 'VGSNAG3' }).toArray()
    const data = customers.map(c => ({
        email: c.email,
        password: c.pw,
        tcu_id: toHex(GetPropValue(c, 'tcu_read_identifiers.identification')),
        tcu_hardware_number: toHex(GetPropValue(c, 'tcu_read_identifiers.hardware_part_number')),
        tcu_software_number: getAscii(GetPropValue(c, 'tcu_read_identifiers.software_part_numbers')),
        tcu_serial_number: getAscii(GetPropValue(c, 'tcu_read_identifiers.device_serial_#')),
        switchover: GetPropValue(c, 'otherInfo.vgsnag3_switchover')
    }))
    // console.dir(data)
    const rows = data.map(d => [
        d.email,
        d.password,
        d.tcu_id,
        d.tcu_hardware_number,
        d.tcu_software_number,
        d.tcu_serial_number,
        d.switchover
    ].join(',').replace(/\n/g, '\\n'))
    rows.unshift([
        'email',
        'password',
        'tcu_id',
        'tcu_hardware_number',
        'tcu_software_number',
        'tcu_serial_number',
        'switchover',
    ].join(','))
    const fileContent = rows.join('\r\n')
    await writeFile("C:\\Users\\worw7\\Desktop\\vgsnag3-customers.csv", fileContent)
}




// - customer email /
// - customer password /
// - tcu id (hex) /
// - tcu hardware number
// - tcu software number (in ascii)
// - tcu serial number (in ascii)
// - switchover (way shown in profile (raw)


run()
.then(() => console.log('Task Completed!'))
.catch(err => console.error(err))
.finally(() => process.exit())