import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pool?: Pool };

const isLocal =
  process.env.DATABASE_URL?.includes("localhost") ||
  process.env.DATABASE_URL?.includes("127.0.0.1");

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 8, // حد أعلى معقول للاتصالات لتفادي إرهاق قاعدة البيانات
    idleTimeoutMillis: 30_000, // أغلق الاتصالات الخاملة
    connectionTimeoutMillis: 10_000, // لا تنتظر اتصالًا للأبد
    keepAlive: true,
  });

// احتفظ بمجمّع واحد عبر إعادة تحميل الوحدات (يمنع تسرّب الاتصالات)
globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
export { schema };
