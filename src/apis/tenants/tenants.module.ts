import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role, Tenant, User, UserRole } from 'src/common/entities';
import { TenantsController } from './controllers/tenants.controller';
import { TenantsService } from './services/tenants.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, User, Role, UserRole])],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}