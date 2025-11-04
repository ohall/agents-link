# agents-link

Ensure AGENTS.md is the single canonical rules file in your repository and automatically expose it to major AI coding environments.

## What it does

`agents-link` treats `AGENTS.md` as the single source of truth and creates symlinks (or managed copies when symlinks aren't available) to the following target rule files:

- `CLAUDE.md` (Claude Code)
- `.cursor/rules/AGENTS.md` (Cursor)
- `.cursorrules` (Cursor legacy)
- `.windsurf/rules/AGENTS.md` (Windsurf)
- `.github/copilot-instructions.md` (GitHub Copilot)
- `.rules` (Zed)

## Installation

```bash
npm install agents-link
# or
pnpm add agents-link
```

## Usage

### Commands

```bash
# Create symlinks or managed copies from AGENTS.md
agents-link init

# Re-sync content to managed copies (when AGENTS.md changes)
agents-link sync

# Remove only symlinks and managed copies
agents-link clean

# Print all target file paths and their status
agents-link print-targets
```

### As an npm script

Add to your `package.json`:

```json
{
  "scripts": {
    "agents:init": "agents-link init",
    "agents:sync": "agents-link sync",
    "agents:clean": "agents-link clean"
  }
}
```

Then run:

```bash
npm run agents:init
```

## How it works

1. **Symlinks first**: The tool attempts to create symlinks to `AGENTS.md`
2. **Fallback to managed copies**: If symlinks fail (e.g., Windows without developer mode), it creates a copy with a header marker
3. **Safe and idempotent**: Never overwrites existing non-managed files
4. **Sync on demand**: Use `agents-link sync` to update managed copies when `AGENTS.md` changes

## Managed copies

When symlinks aren't available, `agents-link` creates managed copies with a header:

```markdown
<!-- agents-link:managed:... -->
<!-- This file is auto-managed by agents-link. Do not edit manually. -->
<!-- Source: AGENTS.md -->
```

The tool uses this marker to identify files it can safely update or remove.

## Requirements

- Node.js >= 18.0.0
- An `AGENTS.md` file in your project root

## License

MIT
