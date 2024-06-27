const MAX_SIZE = 1024 * 1024 * 32 // 32mb

async function binaryBodyParser (req, res, next){
    req.setTimeout(1000 * 60 * 12)
    let bufs = [];
    let totalLength = 0
    req.on('data', (d) => {
        totalLength += d.length
        if(bufs === null) return
        if(totalLength > MAX_SIZE){
            bufs = null
            res.status(400).send("Data too large")
            return
        }
        bufs.push(d)
    })
    req.on('end', async () => {
        if(bufs === null) return
        const buf = Buffer.concat(bufs);
        req.body = buf
        next()
    })
}

function binaryBodyParserChecker(req, res, next, exclude){
    const contentType = req.headers['content-type']
    if(req.method !== 'POST' || contentType !== 'application/octet-stream'){
        return next()
    }
    const { path } = req;
    for(let exPath of exclude){
        if(path.startsWith(exPath)){
            return next()
        }
    }
    return binaryBodyParser(req, res, next)
}


module.exports = function binaryBodyParserFactory(exclude){
    return (req, res, next) => binaryBodyParserChecker(req, res, next, exclude);
}