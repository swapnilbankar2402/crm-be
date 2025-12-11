import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateContactEntity1765427078874 implements MigrationInterface {
    name = 'UpdateContactEntity1765427078874'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_752866c5247ddd34fd05559537"`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD "tags" jsonb`);
        await queryRunner.query(`ALTER TABLE "leads" ADD "email" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "leads" ADD "phone" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "contacts" ALTER COLUMN "firstName" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_752866c5247ddd34fd05559537" ON "contacts" ("email") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_752866c5247ddd34fd05559537"`);
        await queryRunner.query(`ALTER TABLE "contacts" ALTER COLUMN "firstName" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "tags"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_752866c5247ddd34fd05559537" ON "contacts" ("email") `);
    }

}
