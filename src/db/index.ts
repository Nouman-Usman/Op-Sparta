import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it is not supported for "Transaction" pool mode
// Using a singleton pattern to prevent multiple connection pools in development
const globalForDb = global as unknown as {
  client: postgres.Sql | undefined;
};

const client = globalForDb.client ?? postgres(connectionString, { 
  prepare: false,
  // Limit the pool size to avoid hitting "MaxClientsInSessionMode"
  max: 10, 
});

if (process.env.NODE_ENV !== "production") globalForDb.client = client;

export const db = drizzle(client, { schema });
