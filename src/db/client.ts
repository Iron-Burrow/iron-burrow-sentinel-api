import { Pool, type PoolClient, type PoolConfig, type QueryResultRow } from "pg";

let pool: Pool | null = null;

export type Queryable = Pool | PoolClient;

export function createDbPool(config: PoolConfig): Pool {
  return new Pool({
    max: 5,
    statement_timeout: 5000,
    query_timeout: 5000,
    connectionTimeoutMillis: 2000,
    idleTimeoutMillis: 10_000,
    idle_in_transaction_session_timeout: 5000,
    ...config
  });
}

export function getDbPool(connectionString: string): Pool {
  if (!pool) {
    pool = createDbPool({ connectionString });
  }

  return pool;
}

export async function closeDbPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function query<T extends QueryResultRow>(
  connectionString: string,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await getDbPool(connectionString).query<T>(sql, params);
  return result.rows;
}

export async function withTransaction<TValue>(
  connectionString: string,
  operation: (client: PoolClient) => Promise<TValue>
): Promise<TValue> {
  const client = await getDbPool(connectionString).connect();

  try {
    await client.query("begin");
    const result = await operation(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function checkDb(connectionString: string): Promise<{ ok: boolean; latencyMs: number | null }> {
  const startedAt = Date.now();

  try {
    await query(connectionString, "select 1");
    return { ok: true, latencyMs: Date.now() - startedAt };
  } catch {
    return { ok: false, latencyMs: null };
  }
}
