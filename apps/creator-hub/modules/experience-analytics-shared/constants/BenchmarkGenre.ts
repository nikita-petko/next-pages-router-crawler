import { translationKey, TranslationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export enum BenchmarkGenre {
  Education = 'education',
  Entertainment = 'entertainment',
  Game = 'game',
  Action = 'action',
  Adventure = 'adventure',
  RoleplayAndAvatarSim = 'roleplay_and_avatar_sim',
  ObbyAndPlatformer = 'obby_and_platformer',
  PartyAndCasual = 'party_and_casual',
  Puzzle = 'puzzle',
  Rpg = 'rpg',
  Shooter = 'shooter',
  Simulation = 'simulation',
  SportsAndRacing = 'sports_and_racing',
  Strategy = 'strategy',
  Survival = 'survival',
  Shopping = 'shopping',
  Social = 'social',
  UtilityAndOther = 'utility_and_other',
  General = 'general',
}

export const benchmarkGenreToTranslationKey: Record<BenchmarkGenre, TranslationKey> = {
  [BenchmarkGenre.Education]: translationKey('Label.Education', TranslationNamespace.Genres),
  [BenchmarkGenre.Entertainment]: translationKey(
    'Label.Entertainment',
    TranslationNamespace.Genres,
  ),
  [BenchmarkGenre.Game]: translationKey('Label.Game', TranslationNamespace.Genres),
  [BenchmarkGenre.Action]: translationKey('Label.Action', TranslationNamespace.Genres),
  [BenchmarkGenre.Adventure]: translationKey('Label.Adventure', TranslationNamespace.Genres),
  [BenchmarkGenre.RoleplayAndAvatarSim]: translationKey(
    'Label.RoleplayAndAvatarSim',
    TranslationNamespace.Genres,
  ),
  [BenchmarkGenre.ObbyAndPlatformer]: translationKey(
    'Label.ObbyAndPlatformer',
    TranslationNamespace.Genres,
  ),
  [BenchmarkGenre.PartyAndCasual]: translationKey(
    'Label.PartyAndCasual',
    TranslationNamespace.Genres,
  ),
  [BenchmarkGenre.Puzzle]: translationKey('Label.Puzzle', TranslationNamespace.Genres),
  [BenchmarkGenre.Rpg]: translationKey('Label.Rpg', TranslationNamespace.Genres),
  [BenchmarkGenre.Shooter]: translationKey('Label.Shooter', TranslationNamespace.Genres),
  [BenchmarkGenre.Simulation]: translationKey('Label.Simulation', TranslationNamespace.Genres),
  [BenchmarkGenre.SportsAndRacing]: translationKey(
    'Label.SportsAndRacing',
    TranslationNamespace.Genres,
  ),
  [BenchmarkGenre.Strategy]: translationKey('Label.Strategy', TranslationNamespace.Genres),
  [BenchmarkGenre.Survival]: translationKey('Label.Survival', TranslationNamespace.Genres),
  [BenchmarkGenre.Shopping]: translationKey('Label.Shopping', TranslationNamespace.Genres),
  [BenchmarkGenre.Social]: translationKey('Label.Social', TranslationNamespace.Genres),
  [BenchmarkGenre.UtilityAndOther]: translationKey(
    'Label.UtilityAndOther',
    TranslationNamespace.Genres,
  ),
  [BenchmarkGenre.General]: translationKey(
    'Label.BenchmarkSource.Platform',
    TranslationNamespace.Analytics,
  ),
};

export const benchmarkGenreToTranslationKeyOnCharts: Record<BenchmarkGenre, TranslationKey> = {
  [BenchmarkGenre.Education]: translationKey(
    'Label.EducationGenreBenchmark',
    TranslationNamespace.Analytics,
  ),
  [BenchmarkGenre.Entertainment]: translationKey(
    'Label.EntertainmentGenreBenchmark',
    TranslationNamespace.Analytics,
  ),
  [BenchmarkGenre.Game]: translationKey('Label.GameGenreBenchmark', TranslationNamespace.Analytics),
  [BenchmarkGenre.Action]: translationKey(
    'Label.ActionGenreBenchmark',
    TranslationNamespace.Analytics,
  ),
  [BenchmarkGenre.Adventure]: translationKey(
    'Label.AdventureGenreBenchmark',
    TranslationNamespace.Analytics,
  ),
  [BenchmarkGenre.RoleplayAndAvatarSim]: translationKey(
    'Label.RoleplayAndAvatarSimGenreBenchmark',
    TranslationNamespace.Analytics,
  ),
  [BenchmarkGenre.ObbyAndPlatformer]: translationKey(
    'Label.ObbyAndPlatformerGenreBenchmark',
    TranslationNamespace.Analytics,
  ),
  [BenchmarkGenre.PartyAndCasual]: translationKey(
    'Label.PartyAndCasualGenreBenchmark',
    TranslationNamespace.Analytics,
  ),
  [BenchmarkGenre.Puzzle]: translationKey(
    'Label.PuzzleGenreBenchmark',
    TranslationNamespace.Analytics,
  ),
  [BenchmarkGenre.Rpg]: translationKey('Label.RpgGenreBenchmark', TranslationNamespace.Analytics),
  [BenchmarkGenre.Shooter]: translationKey(
    'Label.ShooterGenreBenchmark',
    TranslationNamespace.Analytics,
  ),
  [BenchmarkGenre.Simulation]: translationKey(
    'Label.SimulationGenreBenchmark',
    TranslationNamespace.Analytics,
  ),
  [BenchmarkGenre.SportsAndRacing]: translationKey(
    'Label.SportsAndRacingGenreBenchmark',
    TranslationNamespace.Analytics,
  ),
  [BenchmarkGenre.Strategy]: translationKey(
    'Label.StrategyGenreBenchmark',
    TranslationNamespace.Analytics,
  ),
  [BenchmarkGenre.Survival]: translationKey(
    'Label.SurvivalGenreBenchmark',
    TranslationNamespace.Analytics,
  ),
  [BenchmarkGenre.Shopping]: translationKey(
    'Label.ShoppingGenreBenchmark',
    TranslationNamespace.Analytics,
  ),
  [BenchmarkGenre.Social]: translationKey(
    'Label.SocialGenreBenchmark',
    TranslationNamespace.Analytics,
  ),
  [BenchmarkGenre.UtilityAndOther]: translationKey(
    'Label.UtilityAndOtherGenreBenchmark',
    TranslationNamespace.Analytics,
  ),
  [BenchmarkGenre.General]: translationKey(
    'Label.BenchmarkSource.Platform',
    TranslationNamespace.Analytics,
  ),
};
