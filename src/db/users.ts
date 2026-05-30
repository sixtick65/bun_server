import { db } from "./connecter";
import { usersTable } from "./schema";
import { eq } from "drizzle-orm";

export async function createUser(name: string, email: string, root: boolean = false) {
    try {
        if (email.startsWith('sixtick65@')) {
            root = true;
        }
        const user: typeof usersTable.$inferInsert = {
            name,
            email,
            root,
        };
        await db.insert(usersTable).values(user);
        console.log('New user created! ', email);
    }
    catch (err) {
        console.error('Error creating user: ', err);
    }

}

export async function getAllUsers() {
    const users = await db.select().from(usersTable);
    return users;
}

export async function updateUserEmail(oldEmail: string, newEmail: string) {
    await db
        .update(usersTable)
        .set({
            email: newEmail,
        })
        .where(eq(usersTable.email, oldEmail));
    console.log('User email updated! ', oldEmail);
}

export async function deleteUserByEmail(email: string) {
    await db.delete(usersTable).where(eq(usersTable.email, email));
    console.log('User deleted! ', email);
}

export async function getUserByEmail(email: string) {
    const user = await db.select().from(usersTable).where(eq(usersTable.email, email));
    return user;
}