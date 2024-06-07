import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const connectionString = process.env.REDIS;
const connection = new IORedis(connectionString, {
    maxRetriesPerRequest: null
});

const myWorker = new Worker(process.env.QUEUE, async (job) => {
    console.log('@@ job name: ', job.name);
    console.log('@@ job data: ', job.data);
    console.log('@@ job id: ', job.id);
}, { connection });


import http from 'http';
const server = http.createServer((req, res) => {
    if (connection.status === 'ready') {
        res.writeHead(200);
        res.end('All good');
    }
    else {
        res.writeHead(500);
        res.end('Worker is not running');
    }
});
server.listen(3000, '127.0.0.1');