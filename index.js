require('temp').track()
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const express = require('express')
const morgan = require('morgan')
const slowDown = require("express-slow-down");
const { Server: SocketServer } = require("socket.io");
const { mountHelpers, mountRoutes } = require('./routes')
const app = express()

const IsProd = fs.existsSync(path.join(__dirname, '.prod'))
const DEV = !IsProd

const UseHTTPS = !DEV
const _PortBase = IsProd ? 8000 : 9000
const port = _PortBase + 85
const httpsPort = _PortBase + 86

const _PortsConfig = {
  _PortBase: _PortBase,
  httpPort: port,
  httpsPort: httpsPort,
}

global.httpConfig = {
  ..._PortsConfig,
  _PortsConfig,
}

const binaryBodyParser = require('./middlewares/binaryBodyParser')
const { TasksManager } = require('./tasks')
const { coll, client } = require('./db')
const { MicroApps } = require('./micro-apps')
const { TLSCertThumbprintServerService } = require('./services/security/tls-cert-thumbprint-server')


let server = http.createServer()
let httpsServer = null
if(UseHTTPS){
  const privateKey  = fs.readFileSync('../data/privkey.pem', 'utf8')
  const certificate = fs.readFileSync('../data/cert.pem', 'utf8')
  const chain = fs.readFileSync('../data/chain.pem', 'utf8')
  const credentials = { key: privateKey, cert: certificate, ca: chain }
  httpsServer = https.createServer(credentials)
  TLSCertThumbprintServerService.Init(certificate)
}

if(!DEV){
  const speedLimiter = slowDown({
    windowMs: 60 * 1000,
    delayAfter: 60 * 5, // allows 5 req/s
    // delayAfter: 30,
    delayMs: 1000
  });
  app.use(speedLimiter);
}

app.use('/webhooks/*', express.text({ limit: '24mb', type: 'application/json' }))
app.use('/webhooks/*', express.text({ limit: '24mb', type: 'application/x-www-form-urlencoded' }))
app.use('/webhooks/*', (req, res, next) => {
  req.textBody = req.body
  try {
    const contentType = req.headers['Content-Type'] || req.headers['content-type'] || ''
    if(contentType === 'application/json'){
      req.body = JSON.parse(req.body)
    }
  } catch (error) {
    // silence
  }
  return next()
})

app.use(express.json({ limit: '4mb' }))
app.use(express.text({ limit: '24mb' }))
app.use(morgan('combined'))
mountHelpers(app)
app.use(binaryBodyParser([
  "/micros-definitions/upload-compiled-definition",
  "/prv/shop/uploadFirmware",
  "/micros-definitions-v2/upload-compiled-definition",
  "/prv/shop/upload-file"
]))

mountRoutes(app)

TasksManager.InitAll()

server.on('request', (req, res) => {
  console.log(`[HTTP-REQUEST] ${req.method} ${req.url}`)
})
server.on('request', app)
server.listen(port, () => {
  console.log(`comport-server listening at http://localhost:${port}`)
})

if(!!httpsServer){
  httpsServer.on('request', app)
  httpsServer.listen(httpsPort, () => {
    console.log(`comport-server listening at https://localhost:${httpsPort}`)
  })
}

const serverForApps = httpsServer || server
const io = new SocketServer(serverForApps)

MicroApps.InitAll({
  app: app,
  server: serverForApps,
  socketIO: io,
  db: { client: client, coll: coll },
  _PortsConfig,
})