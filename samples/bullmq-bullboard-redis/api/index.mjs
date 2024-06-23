import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import express from 'express';

const connectionString = process.env.REDIS;
const connection = new IORedis(connectionString);

const myQueue = new Queue(process.env.QUEUE, { connection });

const app = express();
app.use(express.json());

// For health check
app.get('/', async (req, res) => {
    res.send('All good');
});

// GET example
app.get('/add', async (req, res) => {
    const params = req.query;
    const name = params.name || 'myjob';
    const data = JSON.parse(params.data || '{}');
    
    await myQueue.add(name, data);
    res.send('Job added');
});

// POST example
app.post('/add', async (req, res) => {
    const body = req.body;
    const name = body.name || 'myjob';
    const data = body.data || {};

    await myQueue.add(name, data);
});

app.listen(3001, () => {
    console.log('Server is running on http://localhost:3001');
});