import type { ListQuery, PaginatedList } from './types/common';

/**
 * Creates an asynchronous iterator that seamlessly pages through all records
 * in a resource collection without requiring manual limit and offset calculation.
 *
 * @param fetchPage Function that accepts a query and returns a paginated list
 * @param initialQuery Initial query parameters
 * @returns AsyncIterable yielding individual resource items across all pages
 *
 * @example
 * ```typescript
 * for await (const payment of insfers.payments.listAutoPaging({ limit: 100 })) {
 *   console.log(payment.id, payment.amount);
 * }
 * ```
 */
export async function* listAutoPaging<T>(
  fetchPage: (query: ListQuery) => Promise<PaginatedList<T>>,
  initialQuery: ListQuery = {},
): AsyncIterable<T> {
  let offset = initialQuery.offset ?? 0;
  const limit = Math.min(Math.max(initialQuery.limit ?? 50, 1), 200);

  while (true) {
    const page = await fetchPage({ ...initialQuery, offset, limit });
    for (const item of page.data) {
      yield item;
    }

    if (!page.hasMore || page.data.length === 0) {
      break;
    }

    offset += page.data.length;
  }
}
