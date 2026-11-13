import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';
import { UserRole } from '../users/entities/user.entity';
import { requireJwtSecret } from './auth.constants';

export type SocketUser = { id: string; role: UserRole };

let verifier: JwtService | undefined;
// Created lazily: JWT_SECRET is only guaranteed to be loaded once the app runs.
const jwt = (): JwtService =>
  (verifier ??= new JwtService({
    secret: requireJwtSecret(process.env.JWT_SECRET),
    verifyOptions: { algorithms: ['HS256'] },
  }));

/**
 * Verifies the access token sent in the Socket.IO handshake
 * (`io(url, { auth: { token } })`, or an `Authorization: Bearer` header).
 * Returns the user, or null when the token is missing or invalid.
 */
export function authenticateSocket(client: Socket): SocketUser | null {
  const fromAuth = (client.handshake.auth as { token?: unknown } | undefined)
    ?.token;
  const fromHeader = client.handshake.headers?.authorization?.replace(
    /^Bearer\s+/i,
    '',
  );
  const token = typeof fromAuth === 'string' ? fromAuth : fromHeader;
  if (!token) return null;
  try {
    const payload = jwt().verify<{ sub: string; role: UserRole }>(token);
    return { id: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

type SocketData = { user?: SocketUser };

export const setSocketUser = (client: Socket, user: SocketUser): void => {
  (client.data as SocketData).user = user;
};

export const getSocketUser = (client: Socket): SocketUser | undefined =>
  (client.data as SocketData).user;

/** Allowed browser origin for the gateways — the same one the REST API allows. */
export const wsCorsOrigin = process.env.FRONTEND_URL ?? 'http://localhost:3001';
