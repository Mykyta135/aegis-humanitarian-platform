import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { RolesGuard } from '../auth/roles.guard';
import { ROLES_KEY } from '../auth/roles.decorator';
import { requireJwtSecret } from '../auth/auth.constants';
import { seedEnabled } from '../seed/seed.controller';
import { User, UserRole } from './entities/user.entity';
import { UsersController, assertSelfOrAdmin } from './users.controller';

const volunteer = { user: { id: 'vol-1', role: UserRole.VOLUNTEER } };
const admin = { user: { id: 'adm-1', role: UserRole.ADMIN } };

describe('users access control', () => {
  it('only admins may update or delete users (incl. changing a role)', () => {
    const roles = (name: keyof UsersController): unknown =>
      Reflect.getMetadata(
        ROLES_KEY,
        Object.getOwnPropertyDescriptor(UsersController.prototype, name)
          ?.value as object,
      );
    expect(roles('update')).toEqual([UserRole.ADMIN]);
    expect(roles('remove')).toEqual([UserRole.ADMIN]);
    expect(roles('create')).toEqual([UserRole.ADMIN]);
  });

  it('a volunteer reads only their own profile; an admin reads anyone', () => {
    expect(() => assertSelfOrAdmin(volunteer, 'vol-1')).not.toThrow();
    expect(() => assertSelfOrAdmin(volunteer, 'vol-2')).toThrow(
      ForbiddenException,
    );
    expect(() => assertSelfOrAdmin(admin, 'vol-2')).not.toThrow();
  });

  it('RolesGuard matches roles exactly', () => {
    const reflector = {
      getAllAndOverride: () => [UserRole.ADMIN],
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const ctx = (user: unknown) =>
      ({
        getHandler: () => null,
        getClass: () => null,
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
      }) as never;
    expect(guard.canActivate(ctx({ role: UserRole.ADMIN }))).toBe(true);
    expect(guard.canActivate(ctx({ role: UserRole.VOLUNTEER }))).toBe(false);
    expect(
      guard.canActivate(ctx({ role: 'not-admin-but-contains-admin' })),
    ).toBe(false);
    expect(guard.canActivate(ctx(undefined))).toBe(false);
  });
});

describe('password hashing', () => {
  it('hashes a password set through an update, and never re-hashes a hash', async () => {
    const user = new User();
    user.email = 'v@aegis.local';
    user.password = 'new-plain-password';
    await user.hashPassword();
    expect(user.password).not.toBe('new-plain-password');
    expect(await bcrypt.compare('new-plain-password', user.password)).toBe(
      true,
    );

    const hashed = user.password;
    await user.hashPassword();
    expect(user.password).toBe(hashed);
  });
});

describe('seed endpoint switch', () => {
  it('is on only with ENABLE_SEED=true outside production', () => {
    expect(seedEnabled({})).toBe(false);
    expect(seedEnabled({ ENABLE_SEED: 'true' })).toBe(true);
    expect(seedEnabled({ ENABLE_SEED: 'true', NODE_ENV: 'production' })).toBe(
      false,
    );
    expect(seedEnabled({ ENABLE_SEED: '1' })).toBe(false);
  });
});

describe('JWT secret', () => {
  it('refuses a missing or short secret', () => {
    expect(() => requireJwtSecret(undefined)).toThrow();
    expect(() => requireJwtSecret('short')).toThrow();
    expect(requireJwtSecret('x'.repeat(32))).toHaveLength(32);
  });
});
