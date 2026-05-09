import { config } from "dotenv"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from "./schema"

config({ path: ".env" })

const globalForDb = globalThis as unknown as {
  pgClientProd?: ReturnType<typeof postgres>
}

if (!process.env.PROD_DATABASE_URL) {
  throw new Error(
    "PROD_DATABASE_URL is not set. Add it to .env to enable analytics queries against the Zyber production database.",
  )
}

const client =
  globalForDb.pgClientProd ??
  postgres(process.env.PROD_DATABASE_URL, {
    max: 10,
    idle_timeout: 30,
    max_lifetime: 60 * 30,
    connect_timeout: 10,
  })

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClientProd = client
}

export const dbProd = drizzle({ client, schema })
