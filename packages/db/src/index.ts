export * from "./queries/index.js";
export { migrate, SCHEMA_SQL } from "./migrate.js";

/** Worker environment bindings */
export interface Env {
  DB: D1Database;
}
