// ============================================================
// @flow/db — 数据库客户端
// ============================================================

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { schema } from './schema';

export type DbClient = PostgresJsDatabase<typeof schema>;

/**
 * 创建数据库连接
 * 使用 Supabase 的 Session Pooler 连接（端口 6543）以获得更好的连接管理
 */
export function createClient(connectionString: string): DbClient {
  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // Supabase 的 PgBouncer 不支持 prepared statements
  });

  return drizzle(client, { schema });
}
