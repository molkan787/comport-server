const { MongoClient } = require("mongodb");
const { Central } = require("./central");
const { mongo_uri } = require('./config.json');
const { EVENTS } = require("./events");

const client = new MongoClient(mongo_uri)

function coll(dbName, collectionName){
    const database = client.db(dbName);
    return database.collection(collectionName);
}

module.exports = {
    client,
    coll
}

client.connect()
.then(() => {
    Central.emit(EVENTS.DATABASE_READY)
})