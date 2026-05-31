// import { getUserByEmail, getAllUsers } from "../src/db/users";
import crud from "../db/generic-crud";
import { usersTable } from "../db/schema";

export async function GET(req: Request) {




  // const user = await getUserByEmail('sixtick65@gmail.com');
  // const users = await getAllUsers();
  const user = await crud.readRecord(usersTable, 1);
  const users = await crud.readRecord(usersTable);
  console.log("GET /api/test - user:", user);
 


  return new Response(`Hello from GET /api/test! ${JSON.stringify(user)} ${JSON.stringify(users)}`);

}