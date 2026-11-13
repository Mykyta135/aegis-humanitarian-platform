import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';
import { UserRole } from '../users/entities/user.entity';
import { authenticateSocket } from './ws-auth';

const SECRET = 'x'.repeat(40);
process.env.JWT_SECRET = SECRET;

const socketWith = (handshake: Partial<Socket['handshake']>) =>
  ({ handshake: { headers: {}, auth: {}, ...handshake } }) as unknown as Socket;

describe('socket authentication', () => {
  const sign = (secret: string) =>
    new JwtService({ secret }).sign({ sub: 'u-1', role: UserRole.VOLUNTEER });

  it('accepts a valid token from the handshake auth', () => {
    expect(
      authenticateSocket(socketWith({ auth: { token: sign(SECRET) } })),
    ).toEqual({
      id: 'u-1',
      role: UserRole.VOLUNTEER,
    });
  });

  it('accepts a Bearer header', () => {
    const headers = { authorization: `Bearer ${sign(SECRET)}` };
    expect(authenticateSocket(socketWith({ headers }))).not.toBeNull();
  });

  it('rejects no token, a garbage token and a token signed with another key', () => {
    expect(authenticateSocket(socketWith({}))).toBeNull();
    expect(
      authenticateSocket(socketWith({ auth: { token: 'nope' } })),
    ).toBeNull();
    expect(
      authenticateSocket(socketWith({ auth: { token: sign('y'.repeat(40)) } })),
    ).toBeNull();
  });
});
