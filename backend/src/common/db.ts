import pg from 'pg';
import { cfg } from './config';

export const pool = new pg.Pool({
  connectionString: cfg.db.url,
});

export const query = <T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
) => pool.query<T>(text, params);

