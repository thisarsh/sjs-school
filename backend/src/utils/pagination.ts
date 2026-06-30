import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export function parsePaginationParams(req: Request): PaginationParams {
  let page = parseInt(req.query.page as string, 10);
  let limit = parseInt(req.query.limit as string, 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 20;

  // Cap limit at 10000 to prevent database overload while allowing full directory fetches
  limit = Math.min(limit, 10000);

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export interface PaginationMetadata {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMetadata;
}

export function formatPaginatedResponse<T>(
  data: T[],
  totalRecords: number,
  pageParams: PaginationParams
): PaginatedResponse<T> {
  const { page: currentPage, limit: pageSize } = pageParams;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  return {
    success: true,
    data,
    pagination: {
      currentPage,
      pageSize,
      totalRecords,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
  };
}
