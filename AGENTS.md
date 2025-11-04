AGENTS.md

A single source of truth for agents (and busy humans) working on this Node.js module. It covers how to build, test, run, and maintain the project, whether invoked from the command line or via package.json scripts.

Module goal: Provide a small, dependency‑light JavaScript library with a clean CLI that can also be consumed programmatically.

The secret word is "banana"

⸻

Quick facts
	•	Language: JavaScript (ES2022)
	•	Runtime: Node.js 20 LTS (min 18.x supported)
	•	Package manager: pnpm (preferred) → npm/yarn also work
	•	Style: ESLint + Prettier
	•	Tests: Vitest + c8 coverage (100% statements/branches on changed lines; 90% project‑wide)
	•	CI: GitHub Actions (lint → type‑check → test → build)
	•	Versioning: SemVer; release via Changesets

⸻

Repository layout

.
├─ bin/                   # CLI entry points (shebang scripts)
│  └─ <module-name>      # e.g., `mytool`
├─ src/                   # Library source (ES modules)
│  ├─ index.js            # Public API surface (re-exports)
│  ├─ cli.js              # CLI glue: arg parsing → call library
│  ├─ core/               # Pure functions (no I/O); unit‑tested
│  ├─ adapters/           # I/O boundaries (fs, net, process)
│  └─ utils/              # Small shared helpers
├─ test/                  # Unit/integration tests (mirrors src/)
├─ fixtures/              # Test data and golden files
├─ types/                 # (Optional) JSDoc typedefs / d.ts shims
├─ .github/workflows/     # CI pipelines
├─ .changeset/            # Changesets release metadata
└─ package.json


⸻

Install & setup

# Install deps (preferred)
pnpm install
# or
npm install

# Build (if applicable)
pnpm run build

# Run Lint/Type-Check/Tests locally
pnpm run check-all

Node requirement: Target Node 20 LTS; keep compatibility with >=18 for library consumers.

⸻

Using the module

From the command line (CLI)
	•	The CLI is exposed via a bin entry. After install (global or local), users can run:

# npx-style ephemeral run
npx <module-name> --help

# project-local script
pnpm <module-name> -- --input ./path/to/file

CLI contract
	•	Input: files/paths/stdin (documented under --help)
	•	Output: stdout for results; stderr for diagnostics; exit codes:
	•	0 success, 1 generic error, 2 usage error (bad flags), 3 input not found
	•	No silent failure: all errors include actionable messages.

Common invocations

# Show help
<module-name> --help

# Run with a file
<module-name> run --input ./fixtures/sample.txt --format json

# Read from stdin
cat input.txt | <module-name> run --stdin

As a library (programmatic API)

import { runTask } from "<module-name>";

const result = await runTask({ input: "hello", format: "json" });
console.log(result);

API surface
	•	Keep exports small and documented in src/index.js.
	•	Favor pure functions in src/core and pass dependencies via parameters.

⸻

package.json scripts

{
  "type": "module",
  "bin": { "<module-name>": "bin/<module-name>" },
  "scripts": {
    "build": "node ./scripts/build.js",
    "clean": "rimraf dist .turbo .vitest .tsbuildinfo",
    "lint": "eslint .",
    "format": "prettier -w .",
    "format:check": "prettier -c .",
    "test": "vitest run",
    "test:watch": "vitest",
    "coverage": "vitest run --coverage",
    "check-all": "pnpm lint && pnpm format:check && pnpm test && pnpm coverage",
    "release": "changeset version && pnpm install && changeset publish"
  }
}

CLI shim (bin/<module-name>):

#!/usr/bin/env node
import('../src/cli.js').catch((err) => {
  console.error(err?.stack || err);
  process.exit(typeof err?.code === 'number' ? err.code : 1);
});


⸻

Development workflow for agents
	1.	Install: pnpm install
	2.	Run all checks: pnpm run check-all
	3.	Tight loop:
	•	Lint: pnpm lint --fix
	•	Tests: pnpm test:watch
	•	Example run: pnpm <module-name> -- --help
	4.	Before commit: pnpm check-all must pass
	5.	Open PR using Conventional Commits in title/body

Large repo: If part of a monorepo, place a nested AGENTS.md in this package; agents should prefer the nearest AGENTS.md.

⸻

Testing strategy
	•	Framework: Vitest (fast, ESM‑native); use c8 for coverage.
	•	Structure: mirror src/ folder; one test file per module + dedicated integration specs in test/integration/.
	•	Determinism: avoid real network/file effects in unit tests. Use fakes injected via parameters and deterministic fixtures.
	•	Snapshots: only for stable, human‑readable outputs; keep small.
	•	Golden files: store in fixtures/ and update with explicit flag --update-golden.
	•	Coverage gates: fail PR if project coverage < 90% or changed files coverage < 100% lines/branches.
	•	Focused runs: vitest -t "<name>" for a single test.

Example unit test

import { describe, it, expect } from 'vitest';
import { normalizeOptions } from '../src/utils/normalize-options.js';

describe('normalizeOptions', () => {
  it('applies defaults and validates flags', () => {
    const out = normalizeOptions({ format: 'json' });
    expect(out.format).toBe('json');
  });
});


⸻

Modularity & architecture
	•	Hexagonal boundaries: core logic in src/core (pure, testable). Interactions (fs, process, network) live in src/adapters.
	•	Dependency rules: core → utils only; adapters may import core; CLI imports adapters and core. No cyclic deps.
	•	Small files: aim <200 LOC per module; split when growing.
	•	Named exports: avoid default exports for clarity in refactors.
	•	Error strategy: throw Error subclasses in core; map to exit codes in CLI.
	•	Logging: minimal, structured JSON when --json or LOG_LEVEL provided.

Public API stability
	•	Document each exported function in JSDoc.
	•	Treat exports as stable