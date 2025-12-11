import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCompanyEntity1765428846533 implements MigrationInterface {
    name = 'UpdateCompanyEntity1765428846533'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_89a223b4d883067d909eedd355"`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "website" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "currency" character varying(10) NOT NULL DEFAULT 'USD'`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "logo" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "isCustomer" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "tags" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "companies" ADD CONSTRAINT "UQ_89a223b4d883067d909eedd3558" UNIQUE ("domain")`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "companySize"`);
        await queryRunner.query(`CREATE TYPE "public"."companies_companysize_enum" AS ENUM('1-10', '11-50', '51-200', '201-500', '500+')`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "companySize" "public"."companies_companysize_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_89a223b4d883067d909eedd355" ON "companies" ("domain") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_89a223b4d883067d909eedd355"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "companySize"`);
        await queryRunner.query(`DROP TYPE "public"."companies_companysize_enum"`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "companySize" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT "UQ_89a223b4d883067d909eedd3558"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "tags"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "isCustomer"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "logo"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "website"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_89a223b4d883067d909eedd355" ON "companies" ("domain") `);
    }

}
