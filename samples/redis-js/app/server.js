const express = require('express');
const redis = require('redis');
const app = express();

// Example: 'rediss://default:<password>@redis-6379.c93.us-east-1-3.ec2.redns.redis-cloud.com:6379'
const redisUrl = process.env.REDISX_URL;
console.log('Connecting to Redis at:', redisUrl);

const client = redis.createClient({
    url: redisUrl
});

app.use(express.static('public'));

client.connect();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/set', async (req, res) => {
  const { value } = req.body;
  if (!value) {
    return res.status(400).send('Missing value');
  }
  await client.set('userInput', value);
  res.send('Value set!');
});

app.get('/get', async (req, res) => {
  const value = await client.get('userInput');
  res.send(value || 'No value');
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
