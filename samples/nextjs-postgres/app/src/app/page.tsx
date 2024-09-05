import { headers } from 'next/headers';
import { Client } from 'pg';

export const dynamic = "force-dynamic";

const client = new Client({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT!, 10),
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Only connect if we actually have the password
const connection = process.env.POSTGRES_PASSWORD ? client.connect() : Promise.resolve();

function parseIPv6MappedIPv4(ip: string | null) {
  if (!ip) {
    return null;
  }
  if (ip.startsWith('::ffff:')) {
    return ip.slice(7);
  }
  return ip;
}


function checkIfIpIsPrivate(ip: string) {
  const parts = ip.split('.');
  const [first, second] = parts.map((part) => parseInt(part, 10));
  if (first === 10) {
    return true;
  }
  if (first === 172 && second >= 16 && second <= 31) {
    return true;
  }
  if (first === 192 && second === 168) {
    return true;
  }
  return false;
}

interface IpApiResponse {
  as: string;
  city: string;
  country: string;
  countryCode: string;
  isp: string;
  lat: number;
  lon: number;
  org: string;
  query: string;
  region: string;
  regionName: string;
  status: string;
  timezone: string;
  zip: string;
}

export default async function Home() {
  await connection;
  // we'll create a table to store json objects that hold responses from ip-api.com along with an id and a created_at timestamp
  await client.query(`
    CREATE TABLE IF NOT EXISTS ip_responses (
      id SERIAL PRIMARY KEY,
      response JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const ip = parseIPv6MappedIPv4(headers().get('x-forwarded-for'));
  const isPrivate = ip ? checkIfIpIsPrivate(ip) : false;

  // if we have an ip address, fetch its location data from ip-api.com and insert it into the table
  if (ip && !isPrivate) {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    await client.query(
      'INSERT INTO ip_responses (response) VALUES ($1)',
      [data]
    );
  }

  // fetch the 20 most recent responses from the table
  const { rows } = await client.query(
    'SELECT response, created_at FROM ip_responses ORDER BY created_at DESC LIMIT 20'
  );

  return (
    <div>
      <h1>Recent IP Responses stored in Postgres database managed by Defang</h1>
      <ul>
        {rows.map((row) => {
          const response = row.response as IpApiResponse;
          const createdAt = row.created_at as Date;
          return (
            <li key={row.created_at}>
              A new visitor from {response?.city ?? 'somewhere'}, {response.country ?? 'some country'} at{' '}
              {createdAt.toLocaleString()}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
