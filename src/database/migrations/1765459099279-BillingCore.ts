import { MigrationInterface, QueryRunner } from "typeorm";

export class BillingCore1765459099279 implements MigrationInterface {
    name = 'BillingCore1765459099279'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."plans_interval_enum" AS ENUM('month', 'year')`);
        await queryRunner.query(`CREATE TABLE "plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying(120) NOT NULL, "slug" character varying(120) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isPublic" boolean NOT NULL DEFAULT true, "currency" character varying(10) NOT NULL DEFAULT 'USD', "amountCents" integer NOT NULL DEFAULT '0', "interval" "public"."plans_interval_enum" NOT NULL DEFAULT 'month', "stripePriceId" character varying(200) NOT NULL, "stripeProductId" character varying(200), "limits" jsonb NOT NULL DEFAULT '{}', "features" jsonb NOT NULL DEFAULT '{}', "metadata" jsonb, CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b671aaeeecb098232ba628bf2e" ON "plans" ("stripePriceId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e7b71bb444e74ee067df057397" ON "plans" ("slug") `);
        await queryRunner.query(`CREATE TYPE "public"."tenant_subscriptions_status_enum" AS ENUM('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete_expired')`);
        await queryRunner.query(`CREATE TABLE "tenant_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "tenantId" uuid NOT NULL, "planId" uuid, "stripeCustomerId" character varying(200), "stripeSubscriptionId" character varying(200), "stripePriceId" character varying(200), "status" "public"."tenant_subscriptions_status_enum" NOT NULL DEFAULT 'incomplete', "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false, "currentPeriodStart" TIMESTAMP WITH TIME ZONE, "currentPeriodEnd" TIMESTAMP WITH TIME ZONE, "trialStart" TIMESTAMP WITH TIME ZONE, "trialEnd" TIMESTAMP WITH TIME ZONE, "canceledAt" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, CONSTRAINT "PK_9455f2b3b10365e81538a079da3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6d64168270374b1c03c74d7fed" ON "tenant_subscriptions" ("planId") `);
        await queryRunner.query(`CREATE INDEX "IDX_019cdeacf053a21711d40c4a62" ON "tenant_subscriptions" ("stripeCustomerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ba4b3ee7e6cc82694d066ce9cd" ON "tenant_subscriptions" ("stripeSubscriptionId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_tenant_subscriptions_tenantId" ON "tenant_subscriptions" ("tenantId") `);
        await queryRunner.query(`CREATE TABLE "stripe_webhook_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "stripeEventId" character varying(200) NOT NULL, "type" character varying(200) NOT NULL, "receivedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "processedAt" TIMESTAMP WITH TIME ZONE, "payload" jsonb, "error" text, CONSTRAINT "PK_0cf13fd3f2ff5604e092bc1ff48" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0cd20ab615b5a55f84accf8a01" ON "stripe_webhook_events" ("stripeEventId") `);
        await queryRunner.query(`CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "tenantId" uuid NOT NULL, "uploadedByUserId" uuid NOT NULL, "originalName" character varying(255) NOT NULL, "mimeType" character varying(100) NOT NULL, "size" integer NOT NULL, "s3Key" character varying(500) NOT NULL, "s3Url" character varying(1000) NOT NULL, "entityType" character varying(50), "entityId" uuid, "isPublic" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_269610c73dc40cbf3e07e689b2" ON "files" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4295dab040ca48de6688b75cbb" ON "files" ("uploadedByUserId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_23ed2b1259a0c0077eca7ef32c" ON "files" ("s3Key") `);
        await queryRunner.query(`CREATE INDEX "IDX_4ec36b772343dc48a6e30422ac" ON "files" ("entityType") `);
        await queryRunner.query(`CREATE INDEX "IDX_7cd3e7ec21447f84427cc287a2" ON "files" ("entityId") `);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "tenantId" uuid NOT NULL, "userId" uuid NOT NULL, "action" character varying(100) NOT NULL, "entityType" character varying(50) NOT NULL, "entityId" uuid NOT NULL, "changes" jsonb, "details" jsonb, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_889633a4291bcb0bf4680fff23" ON "audit_logs" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_cfa83f61e4d27a87fcae1e025a" ON "audit_logs" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_cee5459245f652b75eb2759b4c" ON "audit_logs" ("action") `);
        await queryRunner.query(`CREATE INDEX "IDX_01993ae76b293d3b866cc3a125" ON "audit_logs" ("entityType") `);
        await queryRunner.query(`CREATE INDEX "IDX_f23279fad63453147a8efb46cf" ON "audit_logs" ("entityId") `);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('lead_assigned', 'task_due', 'deal_won', 'mention', 'system_alert')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_channels_enum" AS ENUM('in_app', 'email')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "tenantId" uuid NOT NULL, "recipientId" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" text NOT NULL, "body" text, "readAt" TIMESTAMP WITH TIME ZONE, "channels" "public"."notifications_channels_enum" array NOT NULL DEFAULT '{}', "context" jsonb, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d5b86bc522af7cc9e3e13960ff" ON "notifications" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_db873ba9a123711a4bff527ccd" ON "notifications" ("recipientId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9d8adc796dff8c73acd1eba656" ON "notifications" ("readAt") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "notificationSettings" jsonb`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "FK_3c22dd60cf0850aa8ad2e300f12" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "FK_6d64168270374b1c03c74d7fed1" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_269610c73dc40cbf3e07e689b25" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_4295dab040ca48de6688b75cbbf" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_889633a4291bcb0bf4680fff234" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_d5b86bc522af7cc9e3e13960ffb" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_db873ba9a123711a4bff527ccd5" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_db873ba9a123711a4bff527ccd5"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_d5b86bc522af7cc9e3e13960ffb"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_889633a4291bcb0bf4680fff234"`);
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_4295dab040ca48de6688b75cbbf"`);
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_269610c73dc40cbf3e07e689b25"`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" DROP CONSTRAINT "FK_6d64168270374b1c03c74d7fed1"`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" DROP CONSTRAINT "FK_3c22dd60cf0850aa8ad2e300f12"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "notificationSettings"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9d8adc796dff8c73acd1eba656"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_db873ba9a123711a4bff527ccd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d5b86bc522af7cc9e3e13960ff"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_channels_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f23279fad63453147a8efb46cf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_01993ae76b293d3b866cc3a125"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cee5459245f652b75eb2759b4c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cfa83f61e4d27a87fcae1e025a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_889633a4291bcb0bf4680fff23"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7cd3e7ec21447f84427cc287a2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4ec36b772343dc48a6e30422ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_23ed2b1259a0c0077eca7ef32c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4295dab040ca48de6688b75cbb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_269610c73dc40cbf3e07e689b2"`);
        await queryRunner.query(`DROP TABLE "files"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0cd20ab615b5a55f84accf8a01"`);
        await queryRunner.query(`DROP TABLE "stripe_webhook_events"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_tenant_subscriptions_tenantId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ba4b3ee7e6cc82694d066ce9cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_019cdeacf053a21711d40c4a62"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6d64168270374b1c03c74d7fed"`);
        await queryRunner.query(`DROP TABLE "tenant_subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."tenant_subscriptions_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e7b71bb444e74ee067df057397"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b671aaeeecb098232ba628bf2e"`);
        await queryRunner.query(`DROP TABLE "plans"`);
        await queryRunner.query(`DROP TYPE "public"."plans_interval_enum"`);
    }

}
