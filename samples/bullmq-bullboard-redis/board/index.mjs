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

const myQueue = new Queue(process.env.QUEUE, { connection });

// BULL BOARD
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/board');

const board = createBullBoard({
    queues: [new BullMQAdapter(myQueue)],
    serverAdapter: serverAdapter,
});

const app = express();

// For health check
app.get('/', async (req, res) => {
    res.send('All good. Head to /board to see the dashboard.');
});

app.use('/board', basicAuth({
    users: { 'admin': process.env.BOARD_PASSWORD }, // replace with your username and password
    challenge: true
}), serverAdapter.getRouter());

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});