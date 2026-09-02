import { listAutoPaging } from '../src/pagination';
import type { ListQuery, PaginatedList } from '../src/types/common';

interface MockItem {
  id: string;
  amount: number;
}

describe('listAutoPaging Async Generator', () => {
  it('iterates through multiple pages transparently until hasMore is false', async () => {
    const items: MockItem[] = Array.from({ length: 7 }, (_, i) => ({
      id: `item_${i + 1}`,
      amount: (i + 1) * 10,
    }));

    const mockFetchPage = jest.fn().mockImplementation(
      async (query: ListQuery): Promise<PaginatedList<MockItem>> => {
        const offset = query.offset || 0;
        const limit = query.limit || 3;
        const pageData = items.slice(offset, offset + limit);
        return {
          data: pageData,
          total: items.length,
          hasMore: offset + pageData.length < items.length,
        };
      },
    );

    const collected: MockItem[] = [];
    for await (const item of listAutoPaging<MockItem>(mockFetchPage, { limit: 3 })) {
      collected.push(item);
    }

    expect(collected.length).toBe(7);
    expect(collected[0]?.id).toBe('item_1');
    expect(collected[6]?.id).toBe('item_7');
    expect(mockFetchPage).toHaveBeenCalledTimes(3); // 3 items + 3 items + 1 item
  });
});
