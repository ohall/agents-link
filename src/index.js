import fs from "fs";
import path from "path";

const SOURCE_FILE = "AGENTS.md";
const MANAGED_MARKER =
  "agents-link:managed:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

const TARGET_FILES = [
  "CLAUDE.md",
  "GEMINI.md",
  ".cursor/rules/AGENTS.md",
  ".cursorrules",
  ".windsurf/rules/AGENTS.md",
  ".github/copilot-instructions.md",
  ".rules",
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
 * Generate default AGENTS.md template
 */
function generateDefaultAgentsMd() {
  return `# AGENTS.md

A single source of truth for agents (and busy humans) working on this project.

## Project Overview

Describe your project's purpose, goals, and key information here.

## Development Guidelines

Add your development guidelines, coding standards, and best practices here.

## Testing

Describe your testing approach and requirements here.

## Contributing

Add contribution guidelines and workflow information here.

## Additional Notes

Add any other important information for agents and developers working on this project.
`;
}

/**
 * Check if a file is managed by agents-link
 */
function isManagedFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
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
 * @returns {boolean} true if successful, false if failed
 */
function createLink(sourcePath, targetPath) {
  try {
    const absoluteSource = path.resolve(sourcePath);
    const absoluteTarget = path.resolve(targetPath);

    // Check if target already exists
    if (fileExists(absoluteTarget)) {
      if (isSymlink(absoluteTarget)) {
        try {
          const linkTarget = fs.readlinkSync(absoluteTarget);
          const resolvedLink = path.resolve(
            path.dirname(absoluteTarget),
            linkTarget,
          );
          if (resolvedLink === absoluteSource) {
            console.log(`  ✓ ${targetPath} (symlink already exists)`);
            return true;
          } else {
            console.log(`  ⚠ ${targetPath} (symlink exists but points elsewhere)`);
            return true; // Exists, even if pointing elsewhere
          }
        } catch (readlinkError) {
          // Broken symlink - remove it so we can create a new one
          try {
            fs.unlinkSync(absoluteTarget);
          } catch (unlinkError) {
            // If we can't remove it, we'll try to overwrite it below
          }
          // Fall through to create a new symlink
        }
      } else if (isManagedFile(absoluteTarget)) {
        console.log(`  ✓ ${targetPath} (managed copy already exists)`);
        return true;
      } else {
        console.log(`  ⚠ ${targetPath} (file exists, not managed - skipping)`);
        return true; // Exists, even if not managed
      }
    }

    ensureDir(absoluteTarget);

    // Try creating symlink
    try {
      const relativeSource = path.relative(
        path.dirname(absoluteTarget),
        absoluteSource,
      );
      fs.symlinkSync(relativeSource, absoluteTarget, "file");
      console.log(`  ✓ ${targetPath} (symlink created)`);
      return true;
    } catch (symlinkError) {
      // Symlink failed, create managed copy
      try {
        const sourceContent = fs.readFileSync(absoluteSource, "utf8");
        const managedContent = generateManagedHeader() + sourceContent;
        fs.writeFileSync(absoluteTarget, managedContent, "utf8");
        console.log(`  ✓ ${targetPath} (managed copy created)`);
        return true;
      } catch (copyError) {
        console.error(`  ✗ ${targetPath} (failed: ${copyError.message})`);
        return false;
      }
    }
  } catch (error) {
    // Catch any unexpected errors to prevent stopping the loop
    console.error(`  ✗ ${targetPath} (unexpected error: ${error.message})`);
    return false;
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
    const sourceContent = fs.readFileSync(absoluteSource, "utf8");
    const managedContent = generateManagedHeader() + sourceContent;
    fs.writeFileSync(absoluteTarget, managedContent, "utf8");
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

  // Create AGENTS.md if it doesn't exist
  if (!fileExists(sourcePath)) {
    try {
      const defaultContent = generateDefaultAgentsMd();
      fs.writeFileSync(sourcePath, defaultContent, "utf8");
      console.log(`Created ${SOURCE_FILE} with default template.\n`);
    } catch (error) {
      throw Object.assign(
        new Error(`Failed to create ${SOURCE_FILE}: ${error.message}`),
        {
          code: "EIO",
          path: sourcePath,
        },
      );
    }
  }

  console.log(`Initializing agents-link from ${SOURCE_FILE}...\n`);

  const failures = [];
  for (const targetFile of TARGET_FILES) {
    try {
      const success = createLink(sourcePath, path.join(cwd, targetFile));
      if (!success) {
        failures.push(targetFile);
      }
    } catch (error) {
      // Catch any unexpected errors to ensure all files are processed
      console.error(`  ✗ ${targetFile} (error: ${error.message})`);
      failures.push(targetFile);
    }
  }

  if (failures.length > 0) {
    console.log("\n⚠ Warning: Some files failed to be created:");
    for (const file of failures) {
      console.log(`  - ${file}`);
    }
    console.log("\nDone (with errors)!");
    throw Object.assign(
      new Error(`Failed to create ${failures.length} target file(s)`),
      {
        code: "EIO",
        failures,
      },
    );
  }

  console.log("\nDone!");
}

/**
 * Sync content to managed copies
 */
export async function sync() {
  const cwd = process.cwd();
  const sourcePath = path.join(cwd, SOURCE_FILE);

  if (!fileExists(sourcePath)) {
    throw Object.assign(new Error(`${SOURCE_FILE} not found in ${cwd}`), {
      code: "ENOENT",
      path: sourcePath,
    });
  }

  console.log(`Syncing from ${SOURCE_FILE}...\n`);

  for (const targetFile of TARGET_FILES) {
    updateManagedCopy(sourcePath, path.join(cwd, targetFile));
  }

  console.log("\nDone!");
}

/**
 * Clean symlinks and managed copies
 */
export async function clean() {
  const cwd = process.cwd();

  console.log("Cleaning agents-link managed files...\n");

  for (const targetFile of TARGET_FILES) {
    removeLink(path.join(cwd, targetFile));
  }

  console.log("\nDone!");
}

/**
 * Print all target file paths
 */
export async function printTargets() {
  const cwd = process.cwd();

  console.log("Target files:\n");

  for (const targetFile of TARGET_FILES) {
    const absolutePath = path.join(cwd, targetFile);
    const exists = fileExists(absolutePath);
    const isLink = isSymlink(absolutePath);
    const isManaged = !isLink && exists && isManagedFile(absolutePath);

    let status = "";
    if (isLink) {
      status = " [symlink]";
    } else if (isManaged) {
      status = " [managed]";
    } else if (exists) {
      status = " [exists, not managed]";
    } else {
      status = " [not created]";
    }

    console.log(`  ${targetFile}${status}`);
  }
}
