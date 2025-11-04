import { init, sync, clean, printTargets } from './index.js';

const USAGE = `
agents-link - Sync AGENTS.md to AI coding environment rule files

USAGE:
  agents-link <command> [options]

COMMANDS:
  init            Create symlinks or managed copies from AGENTS.md
  sync            Re-copy content to managed copies
  clean           Remove only symlinks and managed copies
  print-targets   Print all target file paths

OPTIONS:
  --help, -h      Show this help message
  --version, -v   Show version

EXAMPLES:
  agents-link init
  agents-link sync
  agents-link clean
  agents-link print-targets
`;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(USAGE);
    process.exit(0);
  }

  if (command === '--version' || command === '-v') {
    console.log('agents-link v1.0.0');
    process.exit(0);
  }

  try {
    switch (command) {
      case 'init':
        await init();
        break;
      case 'sync':
        await sync();
        break;
      case 'clean':
        await clean();
        break;
      case 'print-targets':
        await printTargets();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log(USAGE);
        process.exit(2);
    }
  } catch (error) {
    if (error.code === 'ENOENT' && error.path?.endsWith('AGENTS.md')) {
      console.error('Error: AGENTS.md not found in current directory');
      process.exit(3);
    }
    throw error;
  }
}

main();
