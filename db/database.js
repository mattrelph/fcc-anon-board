const mongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const mongoDbUrl = process.env.DATABASE;
let mongodb;

function connect(callback){
    mongoClient.connect(mongoDbUrl, (err, db) => {
        if (err)
        {
          console.log('Database error: ' + err);
        }
        else
        {
          mongodb = db;
          console.log("Database Connection Successful");
          callback();
        }
    });
}
function get(){
    return mongodb;
}

function close(){
    mongodb.close();
}

module.exports = {
    connect,
    get,
    close
};