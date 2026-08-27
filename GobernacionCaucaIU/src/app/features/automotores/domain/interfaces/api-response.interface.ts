export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[] | any;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}
