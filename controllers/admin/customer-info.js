const FlashingHistoryService = require("../../services/flashingHistory")

module.exports.getCustomerFlashingHistory = async function (req, res){
    try {
        const { customerId } = req.params
        const historyItems = await FlashingHistoryService.GetFlashingHistory(customerId)
        res.send({
            flashingHistory: historyItems
        })
    } catch (error) {
        console.error(error)
        res.status(500).send("Internal Server Error")
    }
}