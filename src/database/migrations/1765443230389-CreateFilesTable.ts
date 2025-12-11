import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFilesTable1765443230389 implements MigrationInterface {
    name = 'CreateFilesTable1765443230389'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "tenantId" uuid NOT NULL, "uploadedByUserId" uuid NOT NULL, "originalName" character varying(255) NOT NULL, "mimeType" character varying(100) NOT NULL, "size" integer NOT NULL, "s3Key" character varying(500) NOT NULL, "s3Url" character varying(1000) NOT NULL, "entityType" character varying(50), "entityId" uuid, "isPublic" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_269610c73dc40cbf3e07e689b2" ON "files" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4295dab040ca48de6688b75cbb" ON "files" ("uploadedByUserId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_23ed2b1259a0c0077eca7ef32c" ON "files" ("s3Key") `);
        await queryRunner.query(`CREATE INDEX "IDX_4ec36b772343dc48a6e30422ac" ON "files" ("entityType") `);
        await queryRunner.query(`CREATE INDEX "IDX_7cd3e7ec21447f84427cc287a2" ON "files" ("entityId") `);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('lead_assigned', 'task_due', 'deal_won', 'mention', 'system_alert')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_channels_enum" AS ENUM('in_app', 'email')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "tenantId" uuid NOT NULL, "recipientId" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" text NOT NULL, "body" text, "readAt" TIMESTAMP WITH TIME ZONE, "channels" "public"."notifications_channels_enum" array NOT NULL DEFAULT '{}', "context" jsonb, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d5b86bc522af7cc9e3e13960ff" ON "notifications" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_db873ba9a123711a4bff527ccd" ON "notifications" ("recipientId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9d8adc796dff8c73acd1eba656" ON "notifications" ("readAt") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "notificationSettings" jsonb`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_269610c73dc40cbf3e07e689b25" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_4295dab040ca48de6688b75cbbf" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_d5b86bc522af7cc9e3e13960ffb" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_db873ba9a123711a4bff527ccd5" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_db873ba9a123711a4bff527ccd5"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_d5b86bc522af7cc9e3e13960ffb"`);
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_4295dab040ca48de6688b75cbbf"`);
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_269610c73dc40cbf3e07e689b25"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "notificationSettings"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9d8adc796dff8c73acd1eba656"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_db873ba9a123711a4bff527ccd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d5b86bc522af7cc9e3e13960ff"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_channels_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7cd3e7ec21447f84427cc287a2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4ec36b772343dc48a6e30422ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_23ed2b1259a0c0077eca7ef32c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4295dab040ca48de6688b75cbb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_269610c73dc40cbf3e07e689b2"`);
        await queryRunner.query(`DROP TABLE "files"`);
    }

}
