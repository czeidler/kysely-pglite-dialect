import { CompiledQuery, DatabaseConnection, QueryResult } from "kysely"
import { PGlite } from "@electric-sql/pglite"
import type { PGliteWorker } from "@electric-sql/pglite/worker"

export class PGliteConnection implements DatabaseConnection {
  private readonly client: PGlite | PGliteWorker

  constructor(client: PGlite | PGliteWorker) {
    this.client = client
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const result = await this.client.query(compiledQuery.sql, [
      ...compiledQuery.parameters,
    ])

    if (result.affectedRows) {
      const numAffectedRows = BigInt(result.affectedRows)
      return {
        numAffectedRows,
        rows: result.rows as O[],
      }
    }

    return {
      rows: result.rows as O[],
    }
  }

  async *streamQuery<O>(
    compiledQuery: CompiledQuery,
    chunkSize: number,
  ): AsyncIterableIterator<QueryResult<O>> {
    if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
      throw new Error("chunkSize must be a positive integer")
    }
    const result = await this.client.query(compiledQuery.sql, [
      ...compiledQuery.parameters,
    ])
    for (let i = 0; i < result.rows.length; i = i + chunkSize) {
      const chunk = result.rows.slice(i, i + chunkSize)
      yield { rows: chunk as O[] }
    }
  }
}
