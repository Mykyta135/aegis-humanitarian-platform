/**
 * The JWT signing key comes from the environment only — a key in source code
 * lets anyone who reads the repository sign their own tokens.
 * Fails at boot when it is missing or too short to be random.
 */
export function requireJwtSecret(value: string | undefined): string {
  if (!value || value.length < 32) {
    throw new Error(
      'JWT_SECRET must be set to a random string of at least 32 characters (e.g. `openssl rand -hex 32`)',
    );
  }
  return value;
}
