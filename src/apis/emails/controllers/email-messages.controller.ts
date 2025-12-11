import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmailMessagesService } from '../services/email-messages.service';
import { SendEmailDto } from '../dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/guards';
import { CurrentTenant, CurrentUser, Roles } from 'src/auth/decorators';

@ApiTags('Emails')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('emails')
export class EmailMessagesController {
  constructor(private readonly emailMessagesService: EmailMessagesService) {}

  @Post('send')
  @Roles('admin', 'manager', 'sales-rep', 'support')
  @ApiOperation({ summary: 'Send an email' })
  async sendEmail(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() sendEmailDto: SendEmailDto,
  ) {
    return this.emailMessagesService.send(tenantId, userId, sendEmailDto);
  }

  @Get('messages/:id')
  @Roles('admin', 'manager', 'sales-rep', 'support')
  @ApiOperation({ summary: 'Get details of a sent email' })
  async getMessage(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.emailMessagesService.findOne(tenantId, id);
  }

  // Add more endpoints like list messages, etc.
}