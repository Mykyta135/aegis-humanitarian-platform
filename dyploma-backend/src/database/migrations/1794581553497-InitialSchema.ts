import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1794581553497 implements MigrationInterface {
  name = 'InitialSchema1794581553497';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."resources_type_enum" AS ENUM('vehicle', 'generator', 'drone', 'medical_kit')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."resources_status_enum" AS ENUM('available', 'in_use', 'maintenance')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."resources_condition_enum" AS ENUM('excellent', 'good', 'needs_maintenance', 'inoperable')`,
    );
    await queryRunner.query(
      `CREATE TABLE "resources" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "type" "public"."resources_type_enum" NOT NULL, "location" jsonb, "status" "public"."resources_status_enum" NOT NULL DEFAULT 'available', "condition" "public"."resources_condition_enum" NOT NULL DEFAULT 'good', "attributes" jsonb, "maintenanceSchedule" jsonb, CONSTRAINT "PK_632484ab9dff41bba94f9b7c85e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "replyTo" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "senderId" uuid, "taskId" uuid, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tasks_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tasks_region_enum" AS ENUM('kyiv', 'kharkiv', 'donetsk', 'zaporizhzhia', 'kherson', 'luhansk')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tasks_priority_enum" AS ENUM('low', 'medium', 'high', 'critical')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tasks_difficulty_enum" AS ENUM('routine', 'complex', 'hazardous')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text NOT NULL, "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'pending', "region" "public"."tasks_region_enum" NOT NULL, "priority" "public"."tasks_priority_enum" NOT NULL DEFAULT 'medium', "difficulty" "public"."tasks_difficulty_enum" NOT NULL DEFAULT 'routine', "requiredSkills" text NOT NULL, "requiredResources" jsonb NOT NULL DEFAULT '[]', "estimatedDurationHours" integer, "startLocation" jsonb, "endLocation" jsonb, "homeBase" jsonb, "creatorId" uuid, "logs" jsonb NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "assigneeId" uuid, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'volunteer')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_experiencelevel_enum" AS ENUM('trainee', 'junior', 'senior', 'expert')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('available', 'on_mission', 'unavailable')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'volunteer', "name" character varying NOT NULL, "skills" text array NOT NULL DEFAULT '{}', "homeBase" jsonb, "experienceLevel" "public"."users_experiencelevel_enum" NOT NULL DEFAULT 'junior', "languages" text NOT NULL DEFAULT '', "phone" text, "notes" text, "status" "public"."users_status_enum" NOT NULL DEFAULT 'available', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."volunteer_requests_status_enum" AS ENUM('pending', 'accepted', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "volunteer_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "taskId" uuid NOT NULL, "requesterId" uuid NOT NULL, "targetId" uuid, "status" "public"."volunteer_requests_status_enum" NOT NULL DEFAULT 'pending', "message" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4d8fb6573a380c24c8f7b76a92f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."resource_requests_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "resource_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "taskId" uuid NOT NULL, "resourceId" uuid NOT NULL, "requesterId" uuid NOT NULL, "status" "public"."resource_requests_status_enum" NOT NULL DEFAULT 'pending', "message" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a6bd0748bed5f2ee77983c1530" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tasks_resources_resources" ("tasksId" uuid NOT NULL, "resourcesId" uuid NOT NULL, CONSTRAINT "PK_c16f8b46532ba324210e17f2fc0" PRIMARY KEY ("tasksId", "resourcesId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_287cc07b4e8dd70388abe7aed0" ON "tasks_resources_resources" ("tasksId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e7aa4a1e25a93c0904574b0545" ON "tasks_resources_resources" ("resourcesId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_fd2c4496fbb610e44408e279537" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_90bc62e96b48a437a78593f78f0" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "volunteer_requests" ADD CONSTRAINT "FK_f0f07cfab4dd962b86ce845796b" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "volunteer_requests" ADD CONSTRAINT "FK_e06f12e9b6c97b83b965367c401" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "volunteer_requests" ADD CONSTRAINT "FK_742de90c6e52b38f2463356fbe3" FOREIGN KEY ("targetId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "resource_requests" ADD CONSTRAINT "FK_e1836527336e882d7cff3b00599" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "resource_requests" ADD CONSTRAINT "FK_e82e5b3a0087d19369e19b2ffa6" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "resource_requests" ADD CONSTRAINT "FK_bef7fc6a5501120131f2f38dcda" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks_resources_resources" ADD CONSTRAINT "FK_287cc07b4e8dd70388abe7aed0d" FOREIGN KEY ("tasksId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks_resources_resources" ADD CONSTRAINT "FK_e7aa4a1e25a93c0904574b05452" FOREIGN KEY ("resourcesId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks_resources_resources" DROP CONSTRAINT "FK_e7aa4a1e25a93c0904574b05452"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks_resources_resources" DROP CONSTRAINT "FK_287cc07b4e8dd70388abe7aed0d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resource_requests" DROP CONSTRAINT "FK_bef7fc6a5501120131f2f38dcda"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resource_requests" DROP CONSTRAINT "FK_e82e5b3a0087d19369e19b2ffa6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resource_requests" DROP CONSTRAINT "FK_e1836527336e882d7cff3b00599"`,
    );
    await queryRunner.query(
      `ALTER TABLE "volunteer_requests" DROP CONSTRAINT "FK_742de90c6e52b38f2463356fbe3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "volunteer_requests" DROP CONSTRAINT "FK_e06f12e9b6c97b83b965367c401"`,
    );
    await queryRunner.query(
      `ALTER TABLE "volunteer_requests" DROP CONSTRAINT "FK_f0f07cfab4dd962b86ce845796b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_90bc62e96b48a437a78593f78f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_fd2c4496fbb610e44408e279537"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e7aa4a1e25a93c0904574b0545"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_287cc07b4e8dd70388abe7aed0"`,
    );
    await queryRunner.query(`DROP TABLE "tasks_resources_resources"`);
    await queryRunner.query(`DROP TABLE "resource_requests"`);
    await queryRunner.query(
      `DROP TYPE "public"."resource_requests_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "volunteer_requests"`);
    await queryRunner.query(
      `DROP TYPE "public"."volunteer_requests_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_experiencelevel_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_difficulty_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_region_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "resources"`);
    await queryRunner.query(`DROP TYPE "public"."resources_condition_enum"`);
    await queryRunner.query(`DROP TYPE "public"."resources_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."resources_type_enum"`);
  }
}
