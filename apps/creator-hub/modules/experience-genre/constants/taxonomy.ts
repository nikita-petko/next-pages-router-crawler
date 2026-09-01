import GenreType from '../enums/GenreType';

type genreToSubgenreType = { [key: string]: GenreType[] };
const genreToSubgenre: genreToSubgenreType = {
  [GenreType.Action]: [
    GenreType.BattlegroundsAndFighting,
    GenreType.MusicAndRhythm,
    GenreType.OpenWorldAction,
  ],
  [GenreType.Adventure]: [GenreType.Exploration, GenreType.ScavengerHunt, GenreType.Story],
  [GenreType.Education]: [],
  [GenreType.Entertainment]: [GenreType.MusicAndAudio, GenreType.ShowcaseAndHub, GenreType.Video],
  [GenreType.ObbyAndPlatformer]: [GenreType.ClassicObby, GenreType.Runner, GenreType.TowerObby],
  [GenreType.PartyAndCasual]: [
    GenreType.ChildhoodGame,
    GenreType.ColoringAndDrawing,
    GenreType.Minigame,
    GenreType.Quiz,
  ],
  [GenreType.Puzzle]: [GenreType.EscapeRoom, GenreType.MatchAndMerge, GenreType.Word],
  [GenreType.Rpg]: [GenreType.ActionRpg, GenreType.OpenWorldAndSurvivalRpg, GenreType.TurnBasedRpg],
  [GenreType.RoleplayAndAvatarSim]: [
    GenreType.AnimalSim,
    GenreType.DressUp,
    GenreType.Life,
    GenreType.MorphRoleplay,
    GenreType.PetCare,
  ],
  [GenreType.Shooter]: [GenreType.BattleRoyale, GenreType.DeathmatchShooter, GenreType.PveShooter],
  [GenreType.Shopping]: [GenreType.AvatarShopping],
  [GenreType.Simulation]: [
    GenreType.Idle,
    GenreType.IncrementalSimulator,
    GenreType.PhysicsSim,
    GenreType.Sandbox,
    GenreType.Tycoon,
    GenreType.VehicleSim,
  ],
  [GenreType.Social]: [],
  [GenreType.SportsAndRacing]: [GenreType.Racing, GenreType.Sports],
  [GenreType.Strategy]: [GenreType.BoardAndCardGames, GenreType.TowerDefense],
  [GenreType.Survival]: [GenreType.OneVsAll, GenreType.Escape],
  [GenreType.UtilityAndOther]: [],
};

export default genreToSubgenre;
