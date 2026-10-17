# flourist-api

REST API ของร้าน Flourist (storefront + backoffice) — NestJS 12, Drizzle ORM, Supabase Postgres, Bun

## Commands

- `bun run docker:up` — dev ด้วย Docker ทั้งชุด (Postgres + API + backoffice + storefront; ต้อง clone `../backoffice-template` และ `../Flourist-project-master` ไว้ข้างกัน); ใน container ใช้ `docker compose exec api bun run <script>`
- `bun run start:dev` — dev server ที่ http://localhost:8787/api (Swagger: `/api/docs`)
- `bun run lint` · `bun run typecheck` · `bun run format`
- `bun run test` — unit tests (`src/**/*.spec.ts`)
- `bun run test:e2e` — e2e (`test/`); suite ที่ใช้ DB รันเฉพาะเมื่อมี `TEST_DATABASE_URL`
- `bun run db:generate --name <change>` → ตรวจ SQL ใน `drizzle/` → `bun run db:migrate`

ก่อนจบงานทุกครั้ง: `lint`, `typecheck`, `test`, `build` ต้องผ่าน

## Structure

- `src/config/` — env schema (zod); ตัวแปรใหม่ต้องเพิ่มใน `env.schema.ts` และ `.env.example`
- `src/common/` — โค้ดกลาง ไม่มี business logic
- `src/database/schema/` — หนึ่งไฟล์ต่อหนึ่งตาราง และ export จาก `schema/index.ts`
- `src/modules/<feature>/` — ใช้ `categories/` เป็นต้นแบบ: controller (HTTP) → service (business rules) → repository (SQL เท่านั้น)

## Conventions

- ESM: import ไฟล์ภายในต้องลงท้าย `.js`
- อ่าน config ผ่าน `AppConfigService` เท่านั้น ห้ามอ่าน `process.env` ตรง ๆ ใน `src/`
- ทุกตารางต้อง `.enableRLS()` — API เข้าฐานข้อมูลด้วย role `postgres` เพียงทางเดียว
- Error ต้องเป็น `HttpException` ของ Nest; `AllExceptionsFilter` แปลงเป็นรูปแบบ error กลาง
- Endpoint ใหม่ต้องมี DTO (class-validator) และ decorator ของ Swagger
- ห้ามแก้ไฟล์ migration ที่ commit ไปแล้ว ให้ generate ไฟล์ใหม่
- e2e ห้ามใช้ `DATABASE_URL` ของ Supabase จริง
