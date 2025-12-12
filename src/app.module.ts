import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_PIPE, APP_GUARD } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { UsersModule } from './apis/users/users.module';
import { TenantsModule } from './apis/tenants/tenants.module';
import { RolesModule } from './apis/roles/roles.module';
import { LeadsModule } from './apis/leads/leads.module';
import { PipelinesModule } from './apis/pipelines/pipelines.module';
import { ContactsModule } from './apis/contacts/contacts.module';
import { CompaniesModule } from './apis/companies/companies.module';
import { DealsModule } from './apis/deals/deals.module';
import { ActivitiesModule } from './apis/activities/activities.module';
import { EmailsModule } from './apis/emails/emails.module';
import { NotificationsModule } from './apis/notifications/notifications.module';
import { FilesModule } from './apis/files/files.module';
import { AuditLogsModule } from './apis/audit-logs/audit-logs.module';
import { HealthModule } from './apis/health/health.module';
import { AppCacheModule } from './cache/app-cache.module';
import { BillingModule } from './apis/billing/billing.module';
import { AnalyticsModule } from './apis/analytics/analytics.module';
import { WebhooksModule } from './apis/webhooks/webhooks.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(), // ADD THIS. Must be at the top level.
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    RolesModule,
    LeadsModule,
    PipelinesModule,
    ContactsModule,
    CompaniesModule,
    DealsModule,
    ActivitiesModule,
    EmailsModule,
    NotificationsModule,
    FilesModule,
    AuditLogsModule,
    HealthModule,
    AppCacheModule,
    BillingModule,
    AnalyticsModule,
    WebhooksModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Apply JWT guard globally
    },
  ],
})
export class AppModule {}
