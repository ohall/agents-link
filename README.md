# agents-link

Ensure AGENTS.md is the single canonical rules file in your repository and automatically expose it to major AI coding environments.

`agents-link` follows the [AGENTS.md standard](https://agents.md/)—a simple, open format for guiding coding agents, used by over 20k open-source projects.

## What it does

`agents-link` treats `AGENTS.md` as the single source of truth and creates symlinks (or managed copies when symlinks aren't available) to the following target rule files:

- `CLAUDE.md` (Claude Code)
- `.cursor/rules/AGENTS.md` (Cursor)
- `.cursorrules` (Cursor legacy)
- `.windsurf/rules/AGENTS.md` (Windsurf)
- `.github/copilot-instructions.md` (GitHub Copilot)
- `.rules` (Zed)

## Installation

### Local installation (recommended)

Install as a dev dependency in your project:

```bash
npm install agents-link
# or
pnpm add agents-link
```

### Global installation

Install globally to use `agents-link` from any directory:

```bash
npm install -g agents-link
# or
pnpm add -g agents-link
```

After global installation, you can run `agents-link` from any directory without needing it in your project's dependencies.

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

1. **Auto-creates AGENTS.md**: If `AGENTS.md` doesn't exist, `agents-link init` creates it with a default template
2. **Symlinks first**: The tool attempts to create symlinks to `AGENTS.md`
3. **Fallback to managed copies**: If symlinks fail (e.g., Windows without developer mode), it creates a copy with a header marker
4. **Safe and idempotent**: Never overwrites existing non-managed files
5. **Sync on demand**: Use `agents-link sync` to update managed copies when `AGENTS.md` changes

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
- `AGENTS.md` will be created automatically if it doesn't exist when you run `agents-link init`

## Development

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/agents-link.git
cd agents-link
npm install
```

### Testing locally

```bash
# Test the CLI
./bin/agents-link.js --help

# Test in another directory
mkdir ~/test-agents-link && cd ~/test-agents-link
echo "# Test" > AGENTS.md
npm install /path/to/agents-link
npx agents-link init
```

### Publishing

The project uses GitHub Actions for automated publishing:

- **Manual release**: Go to Actions → "Publish to NPM" → Run workflow and select version bump type
- **Automatic release**: Push to `main` and it auto-bumps patch version and publishes

See [`.github/workflows/README.md`](.github/workflows/README.md) for setup instructions.

## License

MIT
