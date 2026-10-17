const D1_MAX_BOUND_PARAMS = 100;

type InsertQuery<TResult = unknown> = {
  toSQL: () => { params: unknown[] };
} & PromiseLike<TResult>;

async function runChunks<T, TResult>(
  rows: T[],
  build: (chunk: T[]) => InsertQuery<TResult>,
  collect: (result: TResult) => void
): Promise<void> {
  if (rows.length === 0) return;

  const query = build(rows);

  // D1 allows at most 100 bound parameters per statement. Split the batch until
  // each compiled statement fits (a single row is sent as-is even if it cannot).
  if (rows.length === 1 || query.toSQL().params.length <= D1_MAX_BOUND_PARAMS) {
    collect(await query);
    return;
  }

  const mid = Math.ceil(rows.length / 2);
  await runChunks(rows.slice(0, mid), build, collect);
  await runChunks(rows.slice(mid), build, collect);
}

export async function insertChunked<T>(
  rows: T[],
  build: (chunk: T[]) => InsertQuery
): Promise<void> {
  await runChunks<T, unknown>(rows, build, () => {});
}

export async function insertChunkedReturning<T, TResult>(
  rows: T[],
  build: (chunk: T[]) => InsertQuery<TResult[]>
): Promise<TResult[]> {
  const results: TResult[] = [];

  await runChunks<T, TResult[]>(rows, build, (result) => {
    results.push(...result);
  });

  return results;
}
