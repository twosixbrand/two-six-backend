import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all permissions grouped by their `group` field.
   */
  async findAll() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ group: 'asc' }, { code: 'asc' }],
    });

    const grouped: Record<string, typeof permissions> = {};
    for (const perm of permissions) {
      if (!grouped[perm.group]) {
        grouped[perm.group] = [];
      }
      grouped[perm.group].push(perm);
    }

    return grouped;
  }

  /**
   * Returns all permissions assigned to a specific role.
   */
  async getByRole(roleId: number) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Rol con ID #${roleId} no encontrado.`);
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { id_role: roleId },
      include: { permission: true },
      orderBy: { permission: { code: 'asc' } },
    });

    return rolePermissions.map((rp) => rp.permission);
  }

  /**
   * Replaces all permissions for a role (delete existing + create new in a transaction).
   */
  async setRolePermissions(roleId: number, permissionIds: number[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Rol con ID #${roleId} no encontrado.`);
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete all existing permissions for this role
      await tx.rolePermission.deleteMany({ where: { id_role: roleId } });

      // Create new permission assignments
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((id_permission) => ({
            id_role: roleId,
            id_permission,
          })),
        });
      }
    });

    // Return the updated permissions
    return this.getByRole(roleId);
  }

  /**
   * Returns the effective permissions for a user (union of all their role permissions).
   */
  async getUserPermissions(userId: number) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { id_user_app: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (userRoles.length === 0) {
      return { roles: [], permissions: [] };
    }

    const roles = userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
    }));

    // Collect unique permissions across all roles
    const permissionMap = new Map<
      number,
      (typeof userRoles)[0]['role']['rolePermissions'][0]['permission']
    >();
    for (const ur of userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionMap.set(rp.permission.id, rp.permission);
      }
    }

    const permissions = Array.from(permissionMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code),
    );

    return { roles, permissions };
  }
}
