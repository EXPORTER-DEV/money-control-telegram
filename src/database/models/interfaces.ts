export interface IPaginationResult<Item> {
    items: Item[];
    count: number;
}

export type PaginationType = Record<string, 1 | -1>;

export interface IPaginationOptions {
    offset?: number;
    limit?: number;
    sort?: PaginationType[];
    query?: Record<string, string>;
}