import { Request } from 'express';

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export const getPaginationOptions = (req: Request): PaginationOptions => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const getSortOptions = (sortBy?: string): Record<string, 1 | -1> => {
  switch (sortBy) {
    case 'newest':
      return { createdAt: -1 };
    case 'oldest':
      return { createdAt: 1 };
    case 'price-low':
      return { price: 1 };
    case 'price-high':
      return { price: -1 };
    case 'popular':
      return { salesCount: -1, viewCount: -1 };
    default:
      return { createdAt: -1 };
  }
};

export const getSearchQuery = (search?: string) => {
  if (!search) return {};
  
  return {
    $or: [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ]
  };
};
