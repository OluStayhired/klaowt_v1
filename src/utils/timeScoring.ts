const debugLog = (message: string, data?: any) => {
  console.log(`[Time Scoring] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

/**
 * Calculates a time relevance score for a post based on its age
 * @param postDate The date of the post
 * @param startDate Optional start date of the time range
 * @param endDate Optional end date of the time range
 * @returns Score between 0 and 1, where 1 is most relevant
 */
export function calculateTimeScore(
  postDate: Date,
  startDate?: Date,
  endDate?: Date
): number {
  const now = new Date();
  
  // If no time range is specified, use a sliding scale based on age
  if (!startDate || !endDate) {
    const ageInHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
    
    // Score decreases logarithmically with age
    // Posts within last hour get score > 0.9
    // Posts within last day get score > 0.5
    // Posts within last week get score > 0.2
    const score = 1 / (1 + Math.log(1 + ageInHours / 24));
    
    debugLog('Calculated age-based score', {
      postDate,
      ageInHours,
      score
    });
    
    return score;
  }

  // For specified time range, use a bell curve distribution
  const rangeMiddle = new Date((startDate.getTime() + endDate.getTime()) / 2);
  const rangeWidth = endDate.getTime() - startDate.getTime();
  
  // Calculate distance from middle of range
  const distanceFromMiddle = Math.abs(postDate.getTime() - rangeMiddle.getTime());
  const normalizedDistance = distanceFromMiddle / (rangeWidth / 2);
  
  // Bell curve formula
  const score = Math.exp(-(normalizedDistance * normalizedDistance) / 2);
  
  debugLog('Calculated time range score', {
    postDate,
    rangeMiddle,
    distanceFromMiddle,
    normalizedDistance,
    score
  });
  
  return score;
}