import { getUserByEmail, getAllUsers } from "../src/db/users";


export async function GET(req: Request) {




  const user = await getUserByEmail('sixtick65@gmail.com');
  const users = await getAllUsers();



  return new Response(`Hello from GET /api/test! ${JSON.stringify(user)} ${JSON.stringify(users)}`);

}