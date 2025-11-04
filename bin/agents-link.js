#!/usr/bin/env node
import('../src/cli.js').catch((err) => {
  console.error(err?.stack || err);
  process.exit(typeof err?.code === 'number' ? err.code : 1);
});
