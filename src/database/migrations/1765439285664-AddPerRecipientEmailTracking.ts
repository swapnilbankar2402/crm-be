import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPerRecipientEmailTracking1765439285664 implements MigrationInterface {
    name = 'AddPerRecipientEmailTracking1765439285664'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."email_recipients_type_enum" AS ENUM('to', 'cc', 'bcc')`);
        await queryRunner.query(`CREATE TYPE "public"."email_recipients_status_enum" AS ENUM('pending', 'sent', 'delivered', 'bounced', 'complained', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "email_recipients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "emailMessageId" uuid NOT NULL, "type" "public"."email_recipients_type_enum" NOT NULL, "email" character varying(255) NOT NULL, "name" character varying(255), "trackingToken" character varying(30) NOT NULL, "status" "public"."email_recipients_status_enum" NOT NULL DEFAULT 'pending', "openCount" integer NOT NULL DEFAULT '0', "clickCount" integer NOT NULL DEFAULT '0', "firstOpenedAt" TIMESTAMP WITH TIME ZONE, "lastOpenedAt" TIMESTAMP WITH TIME ZONE, "firstClickedAt" TIMESTAMP WITH TIME ZONE, "lastClickedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_4a507cbd8d2831e7bf9a437e147" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a8b7bace9cc7dab27dc4f4ea16" ON "email_recipients" ("emailMessageId") `);
        await queryRunner.query(`CREATE INDEX "IDX_dac2aa2a44ee47f8062e250ab4" ON "email_recipients" ("email") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_effa0641bd81dc118007b9289b" ON "email_recipients" ("trackingToken") `);
        await queryRunner.query(`ALTER TABLE "email_messages" DROP COLUMN "deliveredAt"`);
        await queryRunner.query(`ALTER TABLE "email_messages" DROP COLUMN "openCount"`);
        await queryRunner.query(`ALTER TABLE "email_messages" DROP COLUMN "clickCount"`);
        await queryRunner.query(`ALTER TABLE "email_messages" DROP COLUMN "firstOpenedAt"`);
        await queryRunner.query(`ALTER TABLE "email_messages" DROP COLUMN "lastOpenedAt"`);
        await queryRunner.query(`ALTER TABLE "email_messages" DROP COLUMN "firstClickedAt"`);
        await queryRunner.query(`ALTER TABLE "email_messages" DROP COLUMN "lastClickedAt"`);
        await queryRunner.query(`ALTER TABLE "email_messages" DROP COLUMN "cc"`);
        await queryRunner.query(`ALTER TABLE "email_messages" DROP COLUMN "bcc"`);
        await queryRunner.query(`ALTER TABLE "email_messages" DROP COLUMN "to"`);
        await queryRunner.query(`ALTER TABLE "email_events" ADD "recipientId" uuid`);
        await queryRunner.query(`ALTER TABLE "email_events" ADD "linkId" uuid`);
        await queryRunner.query(`ALTER TABLE "email_messages" ADD "publicId" character varying(30) NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."email_messages_status_enum" RENAME TO "email_messages_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."email_messages_status_enum" AS ENUM('draft', 'queued', 'sending', 'sent', 'failed')`);
        await queryRunner.query(`ALTER TABLE "email_messages" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "email_messages" ALTER COLUMN "status" TYPE "public"."email_messages_status_enum" USING "status"::"text"::"public"."email_messages_status_enum"`);
        await queryRunner.query(`ALTER TABLE "email_messages" ALTER COLUMN "status" SET DEFAULT 'draft'`);
        await queryRunner.query(`DROP TYPE "public"."email_messages_status_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_0d82cfcbad698a5600e857c197" ON "email_events" ("recipientId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2dbcbad04b7dbda8c6c1e74389" ON "email_events" ("linkId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_13e3ccaa58fe832cb07d30066c" ON "email_messages" ("publicId") `);
        await queryRunner.query(`ALTER TABLE "email_events" ADD CONSTRAINT "FK_0d82cfcbad698a5600e857c1971" FOREIGN KEY ("recipientId") REFERENCES "email_recipients"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "email_events" ADD CONSTRAINT "FK_2dbcbad04b7dbda8c6c1e743895" FOREIGN KEY ("linkId") REFERENCES "email_links"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "email_recipients" ADD CONSTRAINT "FK_a8b7bace9cc7dab27dc4f4ea161" FOREIGN KEY ("emailMessageId") REFERENCES "email_messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "email_recipients" DROP CONSTRAINT "FK_a8b7bace9cc7dab27dc4f4ea161"`);
        await queryRunner.query(`ALTER TABLE "email_events" DROP CONSTRAINT "FK_2dbcbad04b7dbda8c6c1e743895"`);
        await queryRunner.query(`ALTER TABLE "email_events" DROP CONSTRAINT "FK_0d82cfcbad698a5600e857c1971"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_13e3ccaa58fe832cb07d30066c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2dbcbad04b7dbda8c6c1e74389"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0d82cfcbad698a5600e857c197"`);
        await queryRunner.query(`CREATE TYPE "public"."email_messages_status_enum_old" AS ENUM('queued', 'sending', 'sent', 'failed', 'delivered', 'bounced', 'complained')`);
        await queryRunner.query(`ALTER TABLE "email_messages" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "email_messages" ALTER COLUMN "status" TYPE "public"."email_messages_status_enum_old" USING "status"::"text"::"public"."email_messages_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "email_messages" ALTER COLUMN "status" SET DEFAULT 'queued'`);
        await queryRunner.query(`DROP TYPE "public"."email_messages_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."email_messages_status_enum_old" RENAME TO "email_messages_status_enum"`);
        await queryRunner.query(`ALTER TABLE "email_messages" DROP COLUMN "publicId"`);
        await queryRunner.query(`ALTER TABLE "email_events" DROP COLUMN "linkId"`);
        await queryRunner.query(`ALTER TABLE "email_events" DROP COLUMN "recipientId"`);
        await queryRunner.query(`ALTER TABLE "email_messages" ADD "to" text array NOT NULL`);
        await queryRunner.query(`ALTER TABLE "email_messages" ADD "bcc" text array NOT NULL DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "email_messages" ADD "cc" text array NOT NULL DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "email_messages" ADD "lastClickedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "email_messages" ADD "firstClickedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "email_messages" ADD "lastOpenedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "email_messages" ADD "firstOpenedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "email_messages" ADD "clickCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "email_messages" ADD "openCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "email_messages" ADD "deliveredAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`DROP INDEX "public"."IDX_effa0641bd81dc118007b9289b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dac2aa2a44ee47f8062e250ab4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a8b7bace9cc7dab27dc4f4ea16"`);
        await queryRunner.query(`DROP TABLE "email_recipients"`);
        await queryRunner.query(`DROP TYPE "public"."email_recipients_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."email_recipients_type_enum"`);
    }

}
