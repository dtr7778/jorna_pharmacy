import { faker } from "@faker-js/faker";

const D1_MAX_BOUND_PARAMS = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function splitAmount(total: number): Array<number> {
  if (total < 2 || !faker.datatype.boolean(0.5)) return [total];

  const first = faker.number.int({ min: 1, max: total - 1 });
  return [first, total - first];
}

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
