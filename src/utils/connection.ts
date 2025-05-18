import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import { PrismaNeon, PrismaNeonHTTP } from '@prisma/adapter-neon';
import { PrismaClient } from '@/prisma/client';
import ws from 'ws';

let connectionString = process.env.DATABASE_URL;

// Configuring Neon for local development
if (process.env.NODE_ENV === 'development') {
  connectionString = 'postgres://postgres:postgres@127.0.0.1db.localtest.me:5432/main';
 neonConfig.fetchEndpoint = host => {
    const [protocol, port] = host === '127.0.0.1db.localtest.me' ? ['http', 4444] : ['https', 443];
    return `${protocol}://${host}:${port}/sql`;
  };
  const connectionStringUrl = new URL(connectionString);
  neonConfig.useSecureWebSocket = connectionStringUrl.hostname !== '127.0.0.1db.localtest.me';
  neonConfig.wsProxy = host => (host === '127.0.0.1 db.localtest.me' ? `${host}:4444/v2` : `${host}/v2`);
}
neonConfig.webSocketConstructor = ws;

const sql = neon(connectionString);
const pool = new Pool({ connectionString });

// Prisma supports both HTTP and WebSocket clients. Choose the one that fits your needs:

// HTTP Client:
// - Ideal for stateless operations and quick queries
// - Lower overhead for single queries
const adapterHttp = new PrismaNeonHTTP(sql,{});
export const prismaClientHttp = new PrismaClient({ adapter: adapterHttp });

// WebSocket Client:
// - Best for long-running applications (like servers)
// - Maintains a persistent connection
// - More efficient for multiple sequential queries
// - Better for high-frequency database operations
const adapterWs = new PrismaNeon(pool);
export const prismaClientWs = new PrismaClient({ adapter: adapterWs });
