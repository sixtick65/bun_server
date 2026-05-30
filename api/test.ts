
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';

import { eq } from 'drizzle-orm';
import { usersTable } from '../src/db/schema';

const sqlite = new Database(process.env.DB_FILE_NAME!);
const db = drizzle({ client: sqlite });

export async function GET(req: Request) {
  // const user: typeof usersTable.$inferInsert = {
  //   name: 'John',
  //   email: 'john@example.com',
  // };
  // await db.insert(usersTable).values(user);
  // console.log('New user created!');

  const users = await db.select().from(usersTable);
  console.log('Getting all users from the database: ', users)
  return new Response(`Hello from GET /api/test! ${JSON.stringify(users)}`);

  // await db
  //   .update(usersTable)
  //   .set({
  //     age: 31,
  //   })
  //   .where(eq(usersTable.email, user.email));
  // console.log('User info updated!')
  // await db.delete(usersTable).where(eq(usersTable.email, user.email));
  // console.log('User deleted!')
}