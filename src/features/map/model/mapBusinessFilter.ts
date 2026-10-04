import { Business } from '../../../types';

export function sortBusinessesForMap(businesses: Business[]): Business[] {
  return [...businesses].sort((a, b) => {
    const scoreA =
      (a.verificationStatus === 'verified' ? 100 : 0) +
      ((a.googleRating || a.rating || 0) * 10) +
      (a.isFeatured ? 50 : 0) +
      (a.videoUrl ? 15 : 0) +
      ((a.photos?.length || 0) * 2);
    const scoreB =
      (b.verificationStatus === 'verified' ? 100 : 0) +
      ((b.googleRating || b.rating || 0) * 10) +
      (b.isFeatured ? 50 : 0) +
      (b.videoUrl ? 15 : 0) +
      ((b.photos?.length || 0) * 2);
    if (scoreB !== scoreA) return scoreB - scoreA;

    const reviewsA = a.googleReviewsCount || 0;
    const reviewsB = b.googleReviewsCount || 0;
    if (reviewsB !== reviewsA) return reviewsB - reviewsA;

    const dateA = a.createdDate || '';
    const dateB = b.createdDate || '';
    if (dateB !== dateA) return dateB.localeCompare(dateA);

    return a.id.localeCompare(b.id);
  });
}
