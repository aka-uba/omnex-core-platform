#!/usr/bin/env node

/**
 * Migration Version Check Script
 * 
 * Validates schema version format (SemVer) before migrations.
 * 
 * Format: ^v\d+\.\d+\.\d+$ (e.g., v1.4.2)
 * Invalid formats: v1, 1.4, 2025-Q1
 * 
 * Mode-aware:
 * - DEV MODE: Warning only
 * - GUARDED MODE: Block if format invalid
 */

const fs = require('fs');
const path = require('path');
const { isDevMode, handleValidation } = require('./operational-mode');

// SemVer format: v1.4.2
const SEMVER_REGEX = /^v\d+\.\d+\.\d+$/;

/**
 * Extract version from schema file or environment
 */
function getSchemaVersion() {
  // Try to get from environment variable
  if (process.env.SCHEMA_VERSION) {
    return process.env.SCHEMA_VERSION;
  }
  
  // Try to get from package.json
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
    );
    if (packageJson.schemaVersion) {
      return packageJson.schemaVersion;
    }
  } catch {
    // Ignore
  }
  
  // Try to get from schema registry file
  const schemaRegistryPath = path.join(__dirname, '../prisma/extensions/schema-registry.prisma');
  if (fs.existsSync(schemaRegistryPath)) {
    const content = fs.readFileSync(schemaRegistryPath, 'utf8');
    const versionMatch = content.match(/version\s+String\s*\/\/\s*(v\d+\.\d+\.\d+)/);
    if (versionMatch) {
      return versionMatch[1];
    }
  }
  
  // Default version for new installations
  return 'v1.0.0';
}

/**
 * Validate version format
 */
function validateVersionFormat(version) {
  if (!version) {
    return {
      valid: false,
      message: 'Schema version not found. Set SCHEMA_VERSION environment variable or update package.json schemaVersion field.'
    };
  }
  
  if (!SEMVER_REGEX.test(version)) {
    return {
      valid: false,
      message: `Invalid schema version format: "${version}". Expected format: v1.4.2 (SemVer)`
    };
  }
  
  return {
    valid: true,
    message: `Schema version format is valid: ${version}`
  };
}

/**
 * Check version compatibility (basic check)
 */
function checkVersionCompatibility(currentVersion, targetVersion) {
  if (!currentVersion || !targetVersion) {
    return { compatible: true }; // Skip if versions not available
  }
  
  // Extract numbers
  const current = currentVersion.match(/^v(\d+)\.(\d+)\.(\d+)$/);
  const target = targetVersion.match(/^v(\d+)\.(\d+)\.(\d+)$/);
  
  if (!current || !target) {
    return { compatible: true }; // Skip if format invalid (will be caught by format check)
  }
  
  const [cMajor, cMinor, cPatch] = current.slice(1).map(Number);
  const [tMajor, tMinor, tPatch] = target.slice(1).map(Number);
  
  // Major version change requires explicit approval
  if (tMajor > cMajor) {
    return {
      compatible: false,
      message: `Major version upgrade detected: ${currentVersion} → ${targetVersion}. This requires explicit approval.`
    };
  }
  
  // Minor version downgrade is not allowed
  if (tMajor === cMajor && tMinor < cMinor) {
    return {
      compatible: false,
      message: `Minor version downgrade detected: ${currentVersion} → ${targetVersion}. Downgrades are not allowed.`
    };
  }
  
  return { compatible: true };
}

/**
 * Validate migration version
 */
function validateMigrationVersion() {
  const version = getSchemaVersion();
  const formatCheck = validateVersionFormat(version);
  
  if (!formatCheck.valid) {
    handleValidation(new Error(formatCheck.message), formatCheck.message);
    return false;
  }
  
  console.log(`✅ Schema version format is valid: ${version}`);
  
  // Additional compatibility check (if current version available)
  const currentVersion = process.env.CURRENT_SCHEMA_VERSION;
  if (currentVersion) {
    const compatCheck = checkVersionCompatibility(currentVersion, version);
    if (!compatCheck.compatible) {
      handleValidation(new Error(compatCheck.message), compatCheck.message);
      return false;
    }
  }
  
  return true;
}

// Run validation
try {
  const isValid = validateMigrationVersion();
  if (!isValid && !isDevMode()) {
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error validating migration version:', error.message);
  process.exit(1);
}

