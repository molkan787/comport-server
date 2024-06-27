const BinToolsService = require('../services/binTools')
const { validateStrings } = require('../utils')

async function Apply (req, res){
    try {
        const bin = req.body
        const options = req.query
        const { microModel, toolName } = options
        const validInput = validateStrings(microModel, toolName)
        if(!validInput){
            res.status(400).send('Invalid input: Missing one or more of options\' parameters.')
            return
        }
        const result = await BinToolsService.Apply(bin, options)
        res.send(result)
    } catch (error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
    }
}

async function ListTools(req, res){
    try {
        const toolsList = BinToolsService.GetToolsList()
        res.send({
            toolsList
        })
    } catch (error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
    }
}

module.exports = {
    Apply,
    ListTools
}