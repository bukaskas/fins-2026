import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@/lib/generated/prisma/client' // Changed this line
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaNeon({ connectionString });

export const prisma = new PrismaClient({ adapter });