import { Request, Response, NextFunction } from 'express';
import Content from '@/models/Content';
import Purchase from '@/models/Purchase';
import User from '@/models/User';
import { sendSuccess } from '@/utils/response';
import { AppError } from '@/types';

export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    // Get user's content - exclude soft deleted content
    const userContent = await Content.find({ 
      creator: userId,
      deletedAt: null // Only include non-deleted content
    }).select('_id');
    const contentIds = userContent.map(content => content._id);

    // Calculate total revenue
    const revenueResult = await Purchase.aggregate([
      { $match: { content: { $in: contentIds }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Calculate total sales
    const totalSales = await Purchase.countDocuments({ 
      content: { $in: contentIds },
      status: 'completed'
    });

    // Calculate unique customers
    const uniqueCustomers = await Purchase.distinct('buyer', {
      content: { $in: contentIds },
      status: 'completed'
    });

    // Calculate total views
    const totalViews = await Content.aggregate([
      { $match: { creator: userId, deletedAt: null } },
      { $group: { _id: null, total: { $sum: '$viewCount' } } }
    ]);

    // Calculate conversion rate
    const totalViewsCount = totalViews[0]?.total || 0;
    const conversionRate = totalViewsCount > 0 ? (totalSales / totalViewsCount) * 100 : 0;

    // Calculate average order value
    const avgOrderValue = totalSales > 0 ? (revenueResult[0]?.total || 0) / totalSales : 0;

    // Get monthly revenue for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Purchase.aggregate([
      {
        $match: {
          content: { $in: contentIds },
          status: 'completed',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          sales: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get top performing content
    const topContent = await Content.aggregate([
      { $match: { creator: userId } },
      {
        $lookup: {
          from: 'purchases',
          localField: '_id',
          foreignField: 'content',
          as: 'purchases'
        }
      },
      {
        $addFields: {
          revenue: {
            $sum: {
              $map: {
                input: '$purchases',
                as: 'purchase',
                in: {
                  $cond: [
                    { $eq: ['$$purchase.status', 'completed'] },
                    '$$purchase.amount',
                    0
                  ]
                }
              }
            }
          },
          sales: {
            $sum: {
              $map: {
                input: '$purchases',
                as: 'purchase',
                in: {
                  $cond: [
                    { $eq: ['$$purchase.status', 'completed'] },
                    1,
                    0
                  ]
                }
              }
            }
          }
        }
      },
      { $sort: { revenue: -1, sales: -1 } },
      { $limit: 10 },
      {
        $project: {
          contentId: '$_id',
          title: 1,
          sales: 1,
          revenue: 1,
          views: '$viewCount'
        }
      }
    ]);

    const analytics = {
      totalRevenue: revenueResult[0]?.total || 0,
      totalSales,
      uniqueCustomers: uniqueCustomers.length,
      totalViews: totalViewsCount,
      conversionRate: Math.round(conversionRate * 100) / 100,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      monthlyRevenue: monthlyRevenue.map(item => ({
        month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
        revenue: item.revenue,
        sales: item.sales
      })),
      topContent
    };

    sendSuccess(res, analytics, 'Analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getGlobalAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get global platform statistics
    const totalContent = await Content.countDocuments({ isPublished: true });
    const totalCreators = await User.countDocuments({ isCreator: true });
    const totalUsers = await User.countDocuments();
    const totalPurchases = await Purchase.countDocuments({ status: 'completed' });

    // Calculate total platform revenue
    const totalRevenue = await Purchase.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get content by type
    const contentByType = await Content.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Get top creators by earnings
    const topCreators = await User.aggregate([
      { $match: { isCreator: true } },
      { $sort: { totalEarnings: -1 } },
      { $limit: 10 },
      {
        $project: {
          username: 1,
          totalEarnings: 1,
          totalSales: 1
        }
      }
    ]);

    // Get trending content
    const trendingContent = await Content.find({ isPublished: true })
      .populate('creator', 'username avatar')
      .sort({ salesCount: -1, viewCount: -1 })
      .limit(10)
      .select('title type price salesCount viewCount likeCount creator');

    const analytics = {
      platform: {
        totalContent,
        totalCreators,
        totalUsers,
        totalPurchases,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      contentByType,
      topCreators,
      trendingContent
    };

    sendSuccess(res, analytics, 'Global analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getUserAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    // Get user's basic stats - exclude soft deleted content
    const userContent = await Content.find({ 
      creator: userId,
      deletedAt: null // Only include non-deleted content
    }).select('_id title type price salesCount viewCount likeCount');
    const contentIds = userContent.map(content => content._id);

    // Calculate total revenue
    const revenueResult = await Purchase.aggregate([
      { $match: { content: { $in: contentIds }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Calculate total sales
    const totalSales = await Purchase.countDocuments({ 
      content: { $in: contentIds },
      status: 'completed'
    });

    // Calculate total views
    const totalViews = userContent.reduce((sum, content) => sum + content.viewCount, 0);

    // Calculate total likes
    const totalLikes = userContent.reduce((sum, content) => sum + content.likeCount, 0);

    // Calculate active listings
    const activeListings = userContent.length;

    // Calculate monthly growth (simplified)
    const monthlyGrowth = 0; // This would need more complex calculation

    const analytics = {
      totalEarnings: revenueResult[0]?.total || 0,
      totalSales,
      activeListings,
      monthlyGrowth,
      totalViews,
      totalLikes,
      content: userContent.map(item => ({
        id: item._id,
        title: item.title,
        type: item.type,
        price: item.price,
        sales: item.salesCount,
        views: item.viewCount,
        likes: item.likeCount
      }))
    };

    sendSuccess(res, analytics, 'User analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getContentAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    // Verify content belongs to user
    const content = await Content.findOne({ _id: id, creator: userId });
    if (!content) {
      throw new AppError('Content not found or unauthorized', 404);
    }

    // Get content-specific analytics
    const purchases = await Purchase.find({ 
      content: id, 
      status: 'completed' 
    }).populate('buyer', 'username walletAddress');

    const totalRevenue = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);
    const totalSales = purchases.length;

    // Get monthly sales for this content
    const monthlySales = await Purchase.aggregate([
      {
        $match: {
          content: content._id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          sales: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const analytics = {
      content: {
        id: content._id,
        title: content.title,
        type: content.type,
        price: content.price
      },
      stats: {
        totalRevenue,
        totalSales,
        totalViews: content.viewCount,
        totalLikes: content.likeCount,
        conversionRate: content.viewCount > 0 ? (totalSales / content.viewCount) * 100 : 0
      },
      monthlySales: monthlySales.map(item => ({
        month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
        revenue: item.revenue,
        sales: item.sales
      })),
      recentPurchases: purchases.slice(0, 10).map(purchase => ({
        buyer: purchase.buyer,
        amount: purchase.amount,
        createdAt: purchase.createdAt
      }))
    };

    sendSuccess(res, analytics, 'Content analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};
