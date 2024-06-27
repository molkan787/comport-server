const { calculate_VGSNAG3_Switchover } = require("../algorithms/VGSNAG3_SWITCHOVER")
const { EVENTS } = require("../events")
const { Task } = require("../framework/task")
const { IsValidString, IsNotValidString, IsNotValidObject } = require("../jsutils")
const { UpdateCustomer } = require("../services/customers")
const { OBDLabsService } = require("../services/tools/obdlabs")

const MICRO_NAME = 'vgsnag3'
const SOP_KEY = `${MICRO_NAME}_switchover`

class TcuSwitchoverPopulator extends Task{

    async Init(){
        this.Central.on(EVENTS.CUSTOMER_DATA_REPORTED, e => this.handleDataReport(e))
    }

    /**
     * @typedef {{ _id: string, tcu: string, otherInfo: Record<string, string> }} Customer
     * @typedef {{customer: Customer, clientPayload: { items: { dataType: string, data: Record<string, string> }[] }}} DataReportedEvent
     */

    /**
     * @param {DataReportedEvent} e 
     */
    handleDataReport(e){
        this.EnsureTcuSwitchover(e.customer)
    }


    /**
     * @param {Customer} customer 
     */
    async EnsureTcuSwitchover(customer){
        if(this.IsCustomerEligible(customer)){
            await this.PopulateTcuSwitchover(customer)
        }
    }

    /**
     * @param {Customer} customer 
     */
    IsCustomerEligible(customer){
        const tcuName = (customer.tcu || '').toLowerCase()
        if(tcuName === MICRO_NAME){
            const switchover = (customer.otherInfo || {})[SOP_KEY]
            if(IsNotValidString(switchover)){
                return true
            }
        }
        return false
    }

    /**
     * @param {Customer} customer
     * @param {string?} tcuSerialNo
     */
    async PopulateTcuSwitchover(customer, tcuSerialNo){
        let serialNo
        if(typeof tcuSerialNo !== 'undefined'){
            serialNo = tcuSerialNo
        }else{
            const tcuSerialNumber = this.GetTcuSerialNumber(customer)
            if(IsNotValidString(tcuSerialNumber)) return null // Stop if we don't have the serial number
            serialNo = Buffer.from(tcuSerialNumber, 'hex').toString('ascii')
        }
        const switchover = calculate_VGSNAG3_Switchover(serialNo)
        if(IsValidString(switchover)){
            await UpdateCustomer(customer._id, {
                $set: {
                    [`otherInfo.${SOP_KEY}`]: switchover
                }
            })
            return switchover
        }
        return null
    }

    /**
     * @private
     * @param {Customer} customer 
     * @returns {string | null}
     */
    GetTcuSerialNumber(customer){
        const tcuIdentifiers = customer.tcu_read_identifiers
        if(IsNotValidObject(tcuIdentifiers)) return
        const serialNumberItem = Object.entries(tcuIdentifiers)
                .find(id => id[0].toLowerCase().includes('device_serial_#'))
        const serialNumber = Array.isArray(serialNumberItem) && serialNumberItem[1]
        if(Array.isArray(serialNumber)){
            return Buffer.from(serialNumber).toString('hex')
        }else{
            return null
        }
    }

}

module.exports = {
    TcuSwitchoverPopulator,
    MICRO_NAME
}