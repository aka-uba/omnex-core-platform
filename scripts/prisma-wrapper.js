#!/usr/bin/env node

/**
 * Prisma Binary Protection Wrapper
 * 
 * Prevents direct execution of Prisma commands, enforcing the use of npm scripts.
 * 
 * Mode-aware:
 * - DEV MODE: Warning only, allows execution
 * - GUARDED MODE: Blocks execution, requires npm scripts
 */

const { spawn } = require('child_process');
const { isDevMode, handleValidation } = require('./operational-mode');

const command = process.argv[2];
const args = process.argv.slice(3);

// Allowed commands in DEV MODE (read-only operations)
const ALLOWED_DEV_COMMANDS = ['studio', 'format', 'validate'];

if (isDevMode()) {
  // DEV MODE: Warn but allow
  console.warn('⚠️  WARNING: Running Prisma directly in DEV MODE');
  console.warn('Consider using npm scripts instead:');
  console.warn('  npm run prisma:generate');
  console.warn('  npm run prisma:migrate:dev');
  console.warn('');
  
  // Allow read-only commands
  if (ALLOWED_DEV_COMMANDS.includes(command)) {
    console.log(`Running: prisma ${command} ${args.join(' ')}`);
    const prisma = spawn('npx', ['prisma', command, ...args], {
      stdio: 'inherit',
      shell: true
    });
    prisma.on('exit', (code) => process.exit(code || 0));
  } else {
    // For other commands, still warn but allow
    console.warn(`⚠️  Running prisma ${command} directly (DEV MODE allows this)`);
    const prisma = spawn('npx', ['prisma', command, ...args], {
      stdio: 'inherit',
      shell: true
    });
    prisma.on('exit', (code) => process.exit(code || 0));
  }
} else {
  // GUARDED MODE: Block
  console.error('❌ ERROR: Do not run Prisma commands directly in GUARDED MODE!');
  console.error('');
  console.error('Use npm scripts instead:');
  console.error('  npm run prisma:generate');
  console.error('  npm run prisma:migrate:dev');
  console.error('  npm run prisma:studio');
  console.error('');
  console.error('This ensures schema validation and merge steps are executed.');
  process.exit(1);
}


















