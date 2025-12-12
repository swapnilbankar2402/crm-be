import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailRecipientDeliveryFields1765460732530 implements MigrationInterface {
    name = 'AddEmailRecipientDeliveryFields1765460732530'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."webhook_events_source_enum" AS ENUM('stripe', 'ses_sns')`);
        await queryRunner.query(`CREATE TABLE "webhook_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "source" "public"."webhook_events_source_enum" NOT NULL, "externalId" character varying(255) NOT NULL, "type" character varying(255) NOT NULL, "receivedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "processedAt" TIMESTAMP WITH TIME ZONE, "payload" jsonb, "error" text, CONSTRAINT "PK_4cba37e6a0acb5e1fc49c34ebfd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1d649d2bcd652da9b31a163000" ON "webhook_events" ("source", "externalId") `);
        await queryRunner.query(`CREATE TYPE "public"."email_recipients_sendstatus_enum" AS ENUM('queued', 'sent', 'failed', 'delivered', 'bounced', 'complained')`);
        await queryRunner.query(`ALTER TABLE "email_recipients" ADD "sendStatus" "public"."email_recipients_sendstatus_enum" NOT NULL DEFAULT 'queued'`);
        await queryRunner.query(`ALTER TABLE "email_recipients" ADD "providerMessageId" character varying(255)`);
        await queryRunner.query(`CREATE INDEX "IDX_0c28ea12b5903ae1419824b1bc" ON "email_recipients" ("providerMessageId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_0c28ea12b5903ae1419824b1bc"`);
        await queryRunner.query(`ALTER TABLE "email_recipients" DROP COLUMN "providerMessageId"`);
        await queryRunner.query(`ALTER TABLE "email_recipients" DROP COLUMN "sendStatus"`);
        await queryRunner.query(`DROP TYPE "public"."email_recipients_sendstatus_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1d649d2bcd652da9b31a163000"`);
        await queryRunner.query(`DROP TABLE "webhook_events"`);
        await queryRunner.query(`DROP TYPE "public"."webhook_events_source_enum"`);
    }

}
