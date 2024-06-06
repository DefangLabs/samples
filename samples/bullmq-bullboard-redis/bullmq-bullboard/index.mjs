import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import express from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter } from '@bull-board/express';
import basicAuth from 'express-basic-auth';

// BULL QUEUES

const connectionString = process.env.REDIS;
const connection = new IORedis(connectionString, {
    maxRetriesPerRequest: null
  });

const myQueue = new Queue('myqueue', { connection });
const myWorker = new Worker('myqueue', async (job) => {
    console.log(job);
}, { connection });

// BULL BOARD
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
    queues: [new BullMQAdapter(myQueue)],
    serverAdapter: serverAdapter,
});

const app = express();

app.get('/', async (req, res) => {
    res.send('All good');
});

app.use('/admin/queues', basicAuth({
    users: { 'admin': 'password' }, // replace with your username and password
    challenge: true
}), serverAdapter.getRouter());

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});