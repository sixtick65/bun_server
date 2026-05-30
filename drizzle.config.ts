// import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_FILE_NAME!,
  },
});

// bun add better-sqlite3 @types/better-sqlite3 -d
// bun drizzle-kit push

// generate, migrate 는 변경 내용 추적할때 사용 된다. 

// process 는 bun 내장객체. 실행시점에 가져온다.
