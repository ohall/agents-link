import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SOURCE_FILE = 'AGENTS.md';
const MANAGED_MARKER = 'agents-link:managed:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

const TARGET_FILES = [
  'CLAUDE.md',
  '.cursor/rules/AGENTS.md',
  '.cursorrules',
  '.windsurf/rules/AGENTS.md',
  '.github/copilot-instructions.md',
  '.rules'
];

/**
 * Generate the managed file header with marker
 */
function generateManagedHeader() {
  return `<!-- ${MANAGED_MARKER} -->
<!-- This file is auto-managed by agents-link. Do not edit manually. -->
<!-- Source: AGENTS.md -->

`;
}

/**
 * Check if a file is managed by agents-link
 */
function isManagedFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes(MANAGED_MARKER);
  } catch {
    return false;
  }
}

/**
 * Check if a file is a symlink
 */
function isSymlink(filePath) {
  try {
    const stats = fs.lstatSync(filePath);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure directory exists
 */
function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fileExists(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Try to create a symlink, fall back to managed copy if it fails
 */
function createLink(sourcePath, targetPath) {
  const absoluteSource = path.resolve(sourcePath);
  const absoluteTarget = path.resolve(targetPath);

  // Check if target already exists
  if (fileExists(absoluteTarget)) {
    if (isSymlink(absoluteTarget)) {
      const linkTarget = fs.readlinkSync(absoluteTarget);
      const resolvedLink = path.resolve(path.dirname(absoluteTarget), linkTarget);
      if (resolvedLink === absoluteSource) {
        console.log(`  ✓ ${targetPath} (symlink already exists)`);
        return;
      } else {
        console.log(`  ⚠ ${targetPath} (symlink exists but points elsewhere)`);
        return;
      }
    } else if (isManagedFile(absoluteTarget)) {
      console.log(`  ✓ ${targetPath} (managed copy already exists)`);
      return;
    } else {
      console.log(`  ⚠ ${targetPath} (file exists, not managed - skipping)`);
      return;
    }
  }

  ensureDir(absoluteTarget);

  // Try creating symlink
  try {
    const relativeSource = path.relative(path.dirname(absoluteTarget), absoluteSource);
    fs.symlinkSync(relativeSource, absoluteTarget, 'file');
    console.log(`  ✓ ${targetPath} (symlink created)`);
    return;
  } catch (symlinkError) {
    // Symlink failed, create managed copy
    try {
      const sourceContent = fs.readFileSync(absoluteSource, 'utf8');
      const managedContent = generateManagedHeader() + sourceContent;
      fs.writeFileSync(absoluteTarget, managedContent, 'utf8');
      console.log(`  ✓ ${targetPath} (managed copy created)`);
    } catch (copyError) {
      console.error(`  ✗ ${targetPath} (failed: ${copyError.message})`);
    }
  }
}

/**
 * Update a managed copy with new content
 */
function updateManagedCopy(sourcePath, targetPath) {
  const absoluteSource = path.resolve(sourcePath);
  const absoluteTarget = path.resolve(targetPath);

  if (!fileExists(absoluteTarget)) {
    console.log(`  - ${targetPath} (does not exist)`);
    return;
  }

  if (isSymlink(absoluteTarget)) {
    console.log(`  - ${targetPath} (symlink, no sync needed)`);
    return;
  }

  if (!isManagedFile(absoluteTarget)) {
    console.log(`  ⚠ ${targetPath} (not managed, skipping)`);
    return;
  }

  try {
    const sourceContent = fs.readFileSync(absoluteSource, 'utf8');
    const managedContent = generateManagedHeader() + sourceContent;
    fs.writeFileSync(absoluteTarget, managedContent, 'utf8');
    console.log(`  ✓ ${targetPath} (synced)`);
  } catch (error) {
    console.error(`  ✗ ${targetPath} (failed: ${error.message})`);
  }
}

/**
 * Remove a symlink or managed copy
 */
function removeLink(targetPath) {
  const absoluteTarget = path.resolve(targetPath);

  if (!fileExists(absoluteTarget)) {
    console.log(`  - ${targetPath} (does not exist)`);
    return;
  }

  if (isSymlink(absoluteTarget)) {
    try {
      fs.unlinkSync(absoluteTarget);
      console.log(`  ✓ ${targetPath} (symlink removed)`);
    } catch (error) {
      console.error(`  ✗ ${targetPath} (failed: ${error.message})`);
    }
    return;
  }

  if (isManagedFile(absoluteTarget)) {
    try {
      fs.unlinkSync(absoluteTarget);
      console.log(`  ✓ ${targetPath} (managed copy removed)`);
    } catch (error) {
      console.error(`  ✗ ${targetPath} (failed: ${error.message})`);
    }
    return;
  }

  console.log(`  ⚠ ${targetPath} (not managed, skipping)`);
}

/**
 * Initialize symlinks or managed copies
 */
export async function init() {
  const cwd = process.cwd();
  const sourcePath = path.join(cwd, SOURCE_FILE);

  if (!fileExists(sourcePath)) {
    throw Object.assign(
      new Error(`${SOURCE_FILE} not found in ${cwd}`),
      { code: 'ENOENT', path: sourcePath }
    );
  }

  console.log(`Initializing agents-link from ${SOURCE_FILE}...\n`);

  for (const targetFile of TARGET_FILES) {
    createLink(sourcePath, path.join(cwd, targetFile));
  }

  console.log('\nDone!');
}

/**
 * Sync content to managed copies
 */
export async function sync() {
  const cwd = process.cwd();
  const sourcePath = path.join(cwd, SOURCE_FILE);

  if (!fileExists(sourcePath)) {
    throw Object.assign(
      new Error(`${SOURCE_FILE} not found in ${cwd}`),
      { code: 'ENOENT', path: sourcePath }
    );
  }

  console.log(`Syncing from ${SOURCE_FILE}...\n`);

  for (const targetFile of TARGET_FILES) {
    updateManagedCopy(sourcePath, path.join(cwd, targetFile));
  }

  console.log('\nDone!');
}

/**
 * Clean symlinks and managed copies
 */
export async function clean() {
  const cwd = process.cwd();

  console.log('Cleaning agents-link managed files...\n');

  for (const targetFile of TARGET_FILES) {
    removeLink(path.join(cwd, targetFile));
  }

  console.log('\nDone!');
}

/**
 * Print all target file paths
 */
export async function printTargets() {
  const cwd = process.cwd();

  console.log('Target files:\n');

  for (const targetFile of TARGET_FILES) {
    const absolutePath = path.join(cwd, targetFile);
    const exists = fileExists(absolutePath);
    const isLink = isSymlink(absolutePath);
    const isManaged = !isLink && exists && isManagedFile(absolutePath);

    let status = '';
    if (isLink) {
      status = ' [symlink]';
    } else if (isManaged) {
      status = ' [managed]';
    } else if (exists) {
      status = ' [exists, not managed]';
    } else {
      status = ' [not created]';
    }

    console.log(`  ${targetFile}${status}`);
  }
}
