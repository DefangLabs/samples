import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import express from 'express';

const connectionString = process.env.REDIS;
const connection = new IORedis(connectionString);

const myQueue = new Queue('myqueue', { connection });

const app = express();

app.get('/', async (req, res) => {
    res.send('All good');
});

app.get('/add', async (req, res) => {
    await myQueue.add('myjob', { foo: 'bar' });
    res.send('Job added');
});

app.listen(3001, () => {
    console.log('Server is running on http://localhost:3001');
});