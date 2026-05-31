import { db } from "./connecter";
import { eq } from "drizzle-orm";
import { type SQLiteTableWithColumns as TableType } from 'drizzle-orm/sqlite-core';

export async function createRecord<T extends TableType<any>>(
  table: T,
  data: T['$inferInsert']) {
  return await db
    .insert(table)
    .values(data)
    .returning(); // SQLite에서도 returning() 지원 (단, 최신 SQLite 버전에 한함)
}

export async function readRecord<T extends TableType<any>>(
  table: T,
  id?: number) {
    if (id) {
      return await db
        .select()
        .from(table)
        .where(eq(table.id, id));
    } else {
      return await db
        .select()
        .from(table);
    }
}

export async function updateRecord<T extends TableType<any>>(
  table: T,
  id: number,
  data: Partial<T['$inferUpdate']>
) {
  return await db
    .update(table)
    .set(data)
    .where(eq(table.id, id))
    .returning();
}

export async function deleteRecord<T extends TableType<any>>(
  table: T,
  id: number
) {
  return await db
    .delete(table)
    .where(eq(table.id, id))
    .returning();
}

const crud = {
  createRecord,
  readRecord,
  updateRecord,
  deleteRecord
};

export default crud;