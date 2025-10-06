# kysely-pglite-dialect

[![NPM Version](https://img.shields.io/npm/v/kysely-pglite-dialect)](https://www.npmjs.com/package/kysely-pglite-dialect)
[![Test](https://github.com/czeidler/kysely-pglite-dialect/actions/workflows/test.yml/badge.svg)](https://github.com/czeidler/kysely-pglite-dialect/actions/workflows/test.yml)
[![Build](https://github.com/czeidler/kysely-pglite-dialect/actions/workflows/build.yml/badge.svg)](https://github.com/czeidler/kysely-pglite-dialect/actions/workflows/build.yml)

Lightweight [Kysely](https://github.com/koskimas/kysely) dialect for [PGlite](https://pglite.dev/) with zero dependencies.

Note, since PGlite is single user and only supports a single connection this library serializes multiple connections,
i.e. acquiring a new connection will block till a previous connection is released.
While this avoids multiple transactions from concurrently using (and messing up) the single PGlite connection, it can also lead to deadlocks that wouldn't occur on a normal Postgres instance.
However, for the most common use-cases PGlite just works fine.

## Setup

```bash
npm i kysely-pglite-dialect kysely @electric-sql/pglite
```

## Usage

Init Kysely like:

```typescript
import { Kysely } from "kysely"
import { PGlite } from "@electric-sql/pglite"
import { PGliteDialect } from "kysely-pglite-dialect"

const db = new Kysely<{
  pglite_test_table: { id: Generated<number>; data: string }
}>({
  dialect: new PGliteDialect(new PGlite()),
})
```

# Credits

Thanks to [kysely-neon](https://github.com/seveibar/kysely-neon) which was used as a template for this repo.
