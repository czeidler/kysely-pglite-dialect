import test from "ava"
import { Generated, Kysely, sql } from "kysely"
import { PGliteDialect } from "../src"
import { PGlite } from "@electric-sql/pglite"

test.serial("should execute basic queries", async (t) => {
  const db = new Kysely<{
    pglite_test_table: { id: Generated<number>; data: string }
  }>({
    dialect: new PGliteDialect(new PGlite()),
  })

  await sql`CREATE TABLE pglite_test_table (
    id SERIAL PRIMARY KEY,
    data VARCHAR
  )`.execute(db)

  await db.insertInto("pglite_test_table").values({ data: "data1" }).execute()

  await db.transaction().execute(async (trx) => {
    await trx
      .insertInto("pglite_test_table")
      .values({ data: "data2" })
      .execute()

    await trx
      .insertInto("pglite_test_table")
      .values({ data: "data3" })
      .execute()
  })

  const result = await db.selectFrom("pglite_test_table").selectAll().execute()

  t.truthy(result)
  t.deepEqual(result[0].data, "data1")
  t.deepEqual(result[1].data, "data2")
  t.deepEqual(result[2].data, "data3")
})

test.serial("should execute stream queries", async (t) => {
  const db = new Kysely<{
    pglite_test_table: { id: Generated<number>; data: string }
  }>({
    dialect: new PGliteDialect(new PGlite()),
  })

  await db.schema
    .createTable("pglite_test_table")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("data", "text")
    .execute()
  await db
    .insertInto("pglite_test_table")
    .values([
      { data: "data1" },
      { data: "data2" },
      { data: "data3" },
      { data: "data4" },
      { data: "data5" },
    ])
    .execute()

  const result: { data: string }[] = []
  for await (const row of db
    .selectFrom("pglite_test_table")
    .selectAll()
    .stream(2)) {
    result.push(row)
  }

  t.deepEqual(result.length, 5)
  t.deepEqual(result[0].data, "data1")
  t.deepEqual(result[1].data, "data2")
  t.deepEqual(result[2].data, "data3")
  t.deepEqual(result[3].data, "data4")
  t.deepEqual(result[4].data, "data5")
})
