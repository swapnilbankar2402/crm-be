import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Seed } from './seed.interface';
import { Role } from '../../common/entities/role.entity';

@Injectable()
export class RolesSeed implements Seed {
  name = 'roles';

  constructor(
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
  ) {}

  async run(): Promise<void> {
    const roles = [
      {
        name: 'Admin',
        slug: 'admin',
        description: 'Tenant Admin',
        isSystem: true,
        permissions: ['*'],
      },
      {
        name: 'Manager',
        slug: 'manager',
        description: 'Team Manager',
        isSystem: true,
        permissions: [
          'leads:*',
          'contacts:*',
          'companies:*',
          'deals:*',
          'activities:*',
          'emails:*',
          'analytics:read',
        ],
      },
      {
        name: 'Sales Rep',
        slug: 'sales-rep',
        description: 'Sales Representative',
        isSystem: true,
        permissions: ['leads:*', 'contacts:*', 'companies:read', 'deals:*', 'activities:*', 'emails:*'],
      },
      {
        name: 'Support',
        slug: 'support',
        description: 'Support Agent',
        isSystem: true,
        permissions: ['leads:read', 'contacts:*', 'companies:read', 'deals:read', 'activities:*'],
      },
      {
        name: 'Viewer',
        slug: 'viewer',
        description: 'Read-only user',
        isSystem: true,
        permissions: ['leads:read', 'contacts:read', 'companies:read', 'deals:read', 'analytics:read'],
      },
    ];

    for (const r of roles) {
      const exists = await this.rolesRepo.findOne({
        where: { slug: r.slug, tenantId: IsNull() },
        withDeleted: true,
      });

      if (exists) {
        await this.rolesRepo.update(exists.id, {
          name: r.name,
          description: r.description,
          isSystem: true,
          permissions: r.permissions,
          deletedAt: null,
        });
      } else {
        await this.rolesRepo.save(
          this.rolesRepo.create({
            tenantId: null,
            ...r,
          }),
        );
      }
    }
  }
}