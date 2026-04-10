import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe, UseGuards } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';


@UseGuards(JwtAuthGuard)
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  /**
   * GET /permissions — List all permissions grouped by group.
   */
  @Get()
  findAll() {
    return this.permissionService.findAll();
  }

  /**
   * GET /permissions/role/:roleId — Get permissions for a role.
   */
  @Get('role/:roleId')
  getByRole(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.permissionService.getByRole(roleId);
  }

  /**
   * POST /permissions/role/:roleId — Set permissions for a role.
   * Body: { permissionIds: number[] }
   */
  @Post('role/:roleId')
  setRolePermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() body: { permissionIds: number[] },
  ) {
    return this.permissionService.setRolePermissions(roleId, body.permissionIds);
  }

  /**
   * GET /permissions/user/:userId — Get effective permissions for a user.
   */
  @Get('user/:userId')
  getUserPermissions(@Param('userId', ParseIntPipe) userId: number) {
    return this.permissionService.getUserPermissions(userId);
  }
}
