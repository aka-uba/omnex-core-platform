/**
 * Operational Mode System
 * 
 * Controls DEV MODE vs GUARDED MODE behavior:
 * - DEV MODE: Warnings only, allows execution
 * - GUARDED MODE: Blocks on errors, strict validation
 */

// Operational mode detection
const DEV_MODE = process.env.DEV_MODE === 'true' || 
                 process.env.NODE_ENV === 'development' ||
                 !process.env.CI;

/**
 * Check if we're in DEV MODE
 */
function isDevMode() {
  return DEV_MODE;
}

/**
 * Check if we're in GUARDED MODE
 */
function isGuardedMode() {
  return !DEV_MODE;
}

/**
 * Get current mode name
 */
function getMode() {
  return DEV_MODE ? 'DEV' : 'GUARDED';
}

/**
 * Handle validation errors based on mode
 * @param {Error} error - The error object
 * @param {string} message - The error message
 * @returns {boolean} - true if should continue, false if should block
 */
function handleValidation(error, message) {
  if (DEV_MODE) {
    console.warn(`⚠️  WARNING (DEV MODE): ${message}`);
    return true; // Continue in DEV MODE
  } else {
    console.error(`❌ ERROR (GUARDED MODE): ${message}`);
    return false; // Block in GUARDED MODE
  }
}

module.exports = {
  isDevMode,
  isGuardedMode,
  getMode,
  handleValidation
};
