#!/usr/bin/env node

import { run } from "./cli.js";

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
