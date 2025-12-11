import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto, QueryContactsDto } from './dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/guards';
import { CurrentTenant, Roles } from 'src/auth/decorators';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @Roles('admin', 'manager', 'sales-rep', 'support')
  @ApiOperation({ summary: 'Create a new contact' })
  @ApiResponse({ status: 201, description: 'Contact created successfully' })
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateContactDto) {
    return this.contactsService.create(tenantId, dto);
  }

  @Get()
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get contacts with filtering and pagination' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryContactsDto) {
    return this.contactsService.findAll(tenantId, query);
  }

  @Get('stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get contacts statistics' })
  getStats(@CurrentTenant() tenantId: string) {
    return this.contactsService.getStats(tenantId);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get contact by ID' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.contactsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'sales-rep', 'support')
  @ApiOperation({ summary: 'Update contact' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete contact (soft delete)' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.contactsService.remove(tenantId, id);
  }

  @Post(':id/restore')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore soft-deleted contact' })
  restore(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.contactsService.restore(tenantId, id);
  }
}
