const KvsService = require('../services/kvs')

module.exports = class KvsController{

    static async SetValues(req, res){
        try {
            const { items, group } = req.body
            if(!Array.isArray(items) && typeof group != 'string'){
                res.status(400).send('Invalid input')
                return
            }
            if(typeof group == 'string'){
                await KvsService.PutGroupValues(group, items)
            }else{
                const queries = items.map(item => KvsService.SetValue(item.group, item.key, item.value))
                await Promise.all(queries)
            }
            res.send({})
        } catch (error) {
            console.error(error)
            res.status(500).send("Internal Server Error")
        }
    }

    static async DeleteValues(req, res){try {
        const { items, group } = req.body
        if(!Array.isArray(items) && typeof group != 'string'){
            res.status(400).send('Invalid input')
            return
        }
        if(typeof group == 'string'){ // delete entire group of values
            await KvsService.DeleteAllGroupValues(group)
        }else{ // delete specified items
            const queries = items.map(({ group, key }) => KvsService.DeleteValue(group, key))
            await Promise.all(queries)
        }
        res.send({})
    } catch (error) {
        console.error(error)
        res.status(500).send("Internal Server Error")
    }
    }

    static async GetValues(req, res){
        try {
            const { items: reqItems, group } = req.body
            if(!Array.isArray(reqItems) && typeof group != 'string'){
                res.status(400).send('Invalid input')
                return
            }
            let items = []
            if(typeof group == 'string'){ // fetch entire group of values
                items = await KvsService.GetAllGroupValues(group)
            }else{ // fetch specified items
                const queries = reqItems.map(({ group, key }) => KvsService.GetItem(group, key))
                items = await Promise.all(queries)
            }
            res.send({
                items
            })
        } catch (error) {
            console.error(error)
            res.status(500).send("Internal Server Error")
        }
    }

}