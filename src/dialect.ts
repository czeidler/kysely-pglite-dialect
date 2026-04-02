import {
  CompiledQuery,
  DatabaseConnection,
  DatabaseIntrospector,
  Dialect,
  Driver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  QueryCompiler,
  TransactionSettings,
} from "kysely"
import { PGlite } from "@electric-sql/pglite"
import type { PGliteWorker } from "@electric-sql/pglite/worker"
import { PGliteConnection } from "connection"

export class PGliteDialect implements Dialect {
  constructor(private readonly pgLite: PGlite | PGliteWorker) { }

  createAdapter() {
    return new PostgresAdapter()
  }

  createDriver(): Driver {
    return new PGliteDriver(this.pgLite)
  }

  createQueryCompiler(): QueryCompiler {
    return new PostgresQueryCompiler()
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new PostgresIntrospector(db)
  }
}

class PGliteDriver implements Driver {
  private client: PGlite | PGliteWorker | undefined
  /**
   * Currently used connection.
   * If another acquireConnection() is called the request is queued till this connection has been released.
   */
  private connection: PGliteConnection | undefined;
  private queue: ((con: PGliteConnection) => void)[] = [];

  constructor(pgLite: PGlite | PGliteWorker) {
    this.client = pgLite
  }

  async init(): Promise<void> { }

  // Serialize access to the connection, i.e. promise is only resolved when the last connection was released.
  async acquireConnection(): Promise<DatabaseConnection> {
    if (this.client === undefined) {
      throw new Error('PGLite not initialized')
    }
    if (this.connection !== undefined) {
      return new Promise((resolve) => {
        this.queue.push(resolve);
      });
    }
    this.connection = new PGliteConnection(this.client);
    return this.connection;
  }

  async releaseConnection(connection: PGliteConnection): Promise<void> {
    if (connection !== this.connection) {
      throw new Error('Invalid connection');
    }
    const removed = this.queue.splice(0, 1);
    const next = removed[0];
    if (next === undefined) {
      this.connection = undefined;
      return;
    }

    next(this.connection);
  }

  async beginTransaction(
    conn: PGliteConnection,
    settings: TransactionSettings
  ): Promise<void> {
    if (settings.isolationLevel) {
      await conn.executeQuery(
        CompiledQuery.raw(
          `start transaction isolation level ${settings.isolationLevel}`
        )
      )
    } else {
      await conn.executeQuery(CompiledQuery.raw("begin"))
    }
  }

  async commitTransaction(conn: PGliteConnection): Promise<void> {
    await conn.executeQuery(CompiledQuery.raw("commit"))
  }

  async rollbackTransaction(conn: PGliteConnection): Promise<void> {
    await conn.executeQuery(CompiledQuery.raw("rollback"))
  }

  async destroy(): Promise<void> {
    await this.client?.close()
    this.client = undefined
  }
}
