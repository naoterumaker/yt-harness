/**
 * D1 schema migration utility.
 *
 * Because Cloudflare Workers cannot read the filesystem at runtime,
 * the SQL schema is embedded as a template literal constant.
 * Once schema.sql is finalized by the parallel agent, paste the
 * full DDL into SCHEMA_SQL below.
 */

// ── Placeholder: replace with the final schema.sql content ──────────
export const SCHEMA_SQL = `
-- TODO: paste final schema.sql content here
`;

/**
 * Run each SQL statement from the given schema string against a D1 database.
 *
 * Statements are split on semicolons. Empty / whitespace-only fragments
 * are silently skipped.
 */
export async function migrate(db: D1Database, sql: string = SCHEMA_SQL): Promise<void> {
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`[migrate] ${statements.length} statement(s) to execute`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`[migrate] (${i + 1}/${statements.length}) executing…`);
    try {
      await db.exec(stmt);
    } catch (err) {
      console.error(`[migrate] statement ${i + 1} failed:`, err);
      throw err;
    }
  }

  console.log("[migrate] all statements executed successfully");
}
