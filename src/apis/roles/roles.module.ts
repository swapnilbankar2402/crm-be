import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role, User, UserRole } from 'src/common/entities';
import { RolesController } from './controllers/roles.controller';
import { RolesService } from './services/roles.service';


@Module({
  imports: [TypeOrmModule.forFeature([Role, UserRole, User])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}