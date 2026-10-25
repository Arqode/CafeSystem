import 'dotenv/config';
import { Pool } from 'pg';
// One connection pool for the whole app (see "Backend & Data Layer").
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
