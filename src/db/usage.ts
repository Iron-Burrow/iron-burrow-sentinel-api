import { query } from "./client.js";

export interface UsageSummary {
  totalRequests: number;
  totalCostUnits: number;
  recent: Array<{
    requestId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    latencyMs: number;
    costUnits: number;
    createdAt: string;
  }>;
}

interface UsageSummaryRow {
  total_requests: string;
  total_cost_units: string;
}

interface UsageLogRow {
  request_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  latency_ms: number;
  cost_units: number;
  created_at: string;
}

interface RateLimitRow {
  request_count: number;
  cost_units: number;
}

export async function logUsage(
  connectionString: string,
  input: {
    requestId: string;
    userId: string | null;
    apiKeyId: string | null;
    endpoint: string;
    method: string;
    statusCode: number;
    latencyMs: number;
    costUnits: number;
  }
): Promise<void> {
  await query(
    connectionString,
    `
    insert into usage_logs (
      request_id,
      user_id,
      api_key_id,
      endpoint,
      method,
      status_code,
      latency_ms,
      cost_units
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      input.requestId,
      input.userId,
      input.apiKeyId,
      input.endpoint,
      input.method,
      input.statusCode,
      input.latencyMs,
      input.costUnits
    ]
  );
}

export async function getUsageSummary(connectionString: string, userId: string): Promise<UsageSummary> {
  const [summaryRows, recentRows] = await Promise.all([
    query<UsageSummaryRow>(
      connectionString,
      `
      select
        count(*)::text as total_requests,
        coalesce(sum(cost_units), 0)::text as total_cost_units
      from usage_logs
      where user_id = $1
      `,
      [userId]
    ),
    query<UsageLogRow>(
      connectionString,
      `
      select request_id, endpoint, method, status_code, latency_ms, cost_units, created_at::text
      from usage_logs
      where user_id = $1
      order by created_at desc
      limit 25
      `,
      [userId]
    )
  ]);

  const summary = summaryRows[0];

  return {
    totalRequests: Number(summary?.total_requests ?? 0),
    totalCostUnits: Number(summary?.total_cost_units ?? 0),
    recent: recentRows.map((row) => ({
      requestId: row.request_id,
      endpoint: row.endpoint,
      method: row.method,
      statusCode: row.status_code,
      latencyMs: row.latency_ms,
      costUnits: row.cost_units,
      createdAt: row.created_at
    }))
  };
}

export async function incrementRateLimitBucket(
  connectionString: string,
  input: { apiKeyId: string; windowStart: Date; windowSeconds: number; costUnits: number }
): Promise<{ requestCount: number; costUnits: number }> {
  const rows = await query<RateLimitRow>(
    connectionString,
    `
    insert into rate_limit_buckets (api_key_id, window_start, window_seconds, request_count, cost_units)
    values ($1, $2, $3, 1, $4)
    on conflict (api_key_id, window_start, window_seconds) do update
    set
      request_count = rate_limit_buckets.request_count + 1,
      cost_units = rate_limit_buckets.cost_units + excluded.cost_units,
      updated_at = now()
    returning request_count, cost_units
    `,
    [input.apiKeyId, input.windowStart.toISOString(), input.windowSeconds, input.costUnits]
  );

  return {
    requestCount: rows[0]?.request_count ?? 1,
    costUnits: rows[0]?.cost_units ?? input.costUnits
  };
}
