//#REMOVE_ME_AFTER_EDITING - This is a sample index.js file for a Node.js application.
// Feel free to delete this file. It's just a placeholder.

const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// Connection URL
const url = process.env.MONGODB_URI;
const client = new MongoClient(url);

async function connectToMongo() {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
  }
}

async function main(){
  await connectToMongo();

  app.get('/', async (req, res) => {
    try {
      await client.db().admin().ping();
      res.send('Hello World! MongoDB is connected');
    } catch (err) {
      res.send('Hello World! MongoDB is NOT connected');
    }
  });
  
  app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
  });
}

main();