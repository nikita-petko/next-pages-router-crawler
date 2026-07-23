const calculateLikePercentage = (
  upVotes: number | undefined,
  downVotes: number | undefined,
): number | null => {
  if (downVotes !== undefined && upVotes !== undefined) {
    const totalVotes = upVotes + downVotes;
    if (totalVotes !== 0) {
      return (100 * upVotes) / totalVotes;
    }
  }
  return null;
};

export default calculateLikePercentage;
