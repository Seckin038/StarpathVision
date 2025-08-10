import pg from 'pg';
import { cfg } from './config';

export const pool = new pg.Pool({
  connectionString: cfg.db.url,
});

export const query = <T = any>(text: string, params?: any[]) =>
  pool.query<T>(text, params);

