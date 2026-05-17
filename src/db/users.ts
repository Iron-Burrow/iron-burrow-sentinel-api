import { query } from "./client.js";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createOrGetUser(
  connectionString: string,
  input: { email: string; name: string }
): Promise<UserRecord> {
  const rows = await query<UserRow>(
    connectionString,
    `
    insert into users (email, name)
    values ($1, $2)
    on conflict (email) do update
    set
      name = excluded.name,
      updated_at = now()
    returning id, email, name, created_at::text, updated_at::text
    `,
    [normalizeEmail(input.email), input.name.trim()]
  );

  return mapUser(rows[0]);
}

export async function getUserById(connectionString: string, id: string): Promise<UserRecord | null> {
  const rows = await query<UserRow>(
    connectionString,
    "select id, email, name, created_at::text, updated_at::text from users where id = $1",
    [id]
  );

  return rows[0] ? mapUser(rows[0]) : null;
}
