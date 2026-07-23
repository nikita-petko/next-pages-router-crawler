enum CreatorRoadmapVoteOptions {
  UpvoteSolvesBlocker = 'UpvoteSolvesBlocker',
  UpvoteNiceToHave = 'UpvoteNiceToHave',
  UpvoteSavesTime = 'UpvoteSavesTime',
  UpvoteCriticalForMyTeam = 'UpvoteCriticalForMyTeam',
  UpvoteHighImpact = 'UpvoteHighImpact',
  DownvoteNotMyUseCase = 'DownvoteNotMyUseCase',
  DownvoteLowPriority = 'DownvoteLowPriority',
  DownvoteTakesTime = 'DownvoteTakesTime',
  DownvoteWrongTimeline = 'DownvoteWrongTimeline',
  DownvoteTooComplex = 'DownvoteTooComplex',
}
export const chipIdToVoteOption: Record<string, CreatorRoadmapVoteOptions> = {
  solvesBlocker: CreatorRoadmapVoteOptions.UpvoteSolvesBlocker,
  niceToHave: CreatorRoadmapVoteOptions.UpvoteNiceToHave,
  savesTime: CreatorRoadmapVoteOptions.UpvoteSavesTime,
  criticalForTeam: CreatorRoadmapVoteOptions.UpvoteCriticalForMyTeam,
  highImpact: CreatorRoadmapVoteOptions.UpvoteHighImpact,
  notMyUseCase: CreatorRoadmapVoteOptions.DownvoteNotMyUseCase,
  lowPriority: CreatorRoadmapVoteOptions.DownvoteLowPriority,
  takesTime: CreatorRoadmapVoteOptions.DownvoteTakesTime,
  wrongTimeline: CreatorRoadmapVoteOptions.DownvoteWrongTimeline,
  tooComplex: CreatorRoadmapVoteOptions.DownvoteTooComplex,
};

export default CreatorRoadmapVoteOptions;
