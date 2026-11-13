import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../users/entities/user.entity';

/** What JwtStrategy puts on `req.user`. */
export type AuthedRequest = { user: { id: string; role: UserRole } };

export const isAdmin = (req: AuthedRequest): boolean =>
  req.user?.role === UserRole.ADMIN;

/** Volunteers may act only on their own records; admins on anyone's. */
export function assertSelfOrAdmin(req: AuthedRequest, id: string): void {
  if (isAdmin(req) || req.user?.id === id) return;
  throw new ForbiddenException('You can only access your own data');
}

/** A task is visible/editable by its creator, its assignee (when allowed) and admins. */
export function assertTaskAccess(
  req: AuthedRequest,
  task: { creatorId?: string | null; assignee?: { id: string } | null },
  { allowAssignee }: { allowAssignee: boolean },
): void {
  if (isAdmin(req)) return;
  const id = req.user?.id;
  if (id && task.creatorId === id) return;
  if (allowAssignee && id && task.assignee?.id === id) return;
  throw new ForbiddenException('You are not part of this mission');
}
