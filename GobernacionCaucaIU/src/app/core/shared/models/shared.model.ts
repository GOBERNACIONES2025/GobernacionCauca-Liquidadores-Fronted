export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[] | any;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface BaseQuerySpec {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortColumn?: string;
  sortDescending?: boolean;
  activo?: boolean;
  [key: string]: any;
}

