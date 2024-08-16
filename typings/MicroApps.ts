import { Express } from 'express'
import { Server } from 'http'
import { Collection, Document, MongoClient } from 'mongodb'
import { Server as SocketServer } from 'socket.io'

export interface AppInitOptions {
    app: Express,
    server: Server,
    socketIO: SocketServer,
    db: {
        client: MongoClient,
        coll: (dbName: string, collectionName: string) => Collection<Document>
    },
    _PortsConfig: {
        _PortBase: number,
        httpPort: number,
        httpsPort: number,
    },
}