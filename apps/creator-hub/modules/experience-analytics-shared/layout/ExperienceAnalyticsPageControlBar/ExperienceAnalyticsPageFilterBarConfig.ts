import {
  FormattedText,
  TranslationKey,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations';
import { NonRAQIUIDimension, UIFilterDimension } from './filterUtils';

/**
 * NOTE(gperkins@ 20230321):
 * The configuration for the filter bar is a specification of all the dimensions it should show
 *  along with how to handle each one.
 *
 * The base config needs the dimension and its name.
 * Based on how it can be filtered, more information is necessary.
 */
type BaseDimensionConfig = {
  dimension: UIFilterDimension;
  dimensionNameKey: TranslationKey;
};

/**
 * Some dimensions require further information from the API to populate their dropdown menu.
 * In this case, we'd expect a wrapper at the page level to manage loading these and feeding
 *  in a different config.
 */
export type LoadingPlaceholderConfig = BaseDimensionConfig & {
  type: 'loading';
};

/**
 * Many dimensions are filtered among a fixed set of strings (e.g. an Enum choice).
 *
 * For these, we define the set of `options` (generic over the enum or string union type `Opts`)
 *  - `renderOption` is the text in the MenuItem
 *  - `blankOption` causes the filter to be removed
 *    (and is displayed if there is no current filter on this dimension)
 */
type SetChoiceConfig<Opts> = {
  options: Readonly<Array<Opts>>;
  blankOption: Opts;
  renderOption: (option: Opts) => FormattedText;
};
export type SingleChoiceConfig<Opts> = BaseDimensionConfig & {
  type: 'single';
} & SetChoiceConfig<Opts>;

export type MultipleChoiceConfig<Opts> = BaseDimensionConfig & {
  type: 'multiple';

  // If defined, `defaultOptions` will be shown if no current filter is on this dimension, instead of `blankOption`
  defaultOptions?: Array<Opts>;
} & SetChoiceConfig<Opts>;

export type TextFilterConfig = BaseDimensionConfig & {
  type: 'text';
};

export type NumericTextFilterConfig = BaseDimensionConfig & {
  type: 'numeric-text';
};

/**
 * // TODO(gperkins@ 20230321): (eventually) choose on a numeric dimension
 * type NumericDimensionConfig = BaseDimensionConfig & {
 *   type: 'numeric';
 *   operator: 'equal' | 'ge' | 'g' | 'l' | 'le';
 *   value: number;
 * };
 */

type FilterBarDimensionConfig<Opts> =
  | LoadingPlaceholderConfig
  | SingleChoiceConfig<Opts>
  | MultipleChoiceConfig<Opts>
  | TextFilterConfig
  | NumericTextFilterConfig;

/**
 * NOTE(gperkins@ 20230321): Each dimension config is based on a different type (various enums)
 * We would prefer this combined type to be conceptually:
 *    "An array of FilterBarDimensionConfig, each of which can be based on a different type"
 *
 * But we cannot choose any single type for all of the configs to be based on.
 * Far as I can tell, we can't even get typescript to constrain:
 *    that all the templated types are based on strings
 *    (how to enforce `extends string` on the templated types...?)
 *
 * TODO(gperkins@20240605): Delete FilterBarConfig soon, use only new FilterDrawer
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- deprecated
export type FilterBarConfig = Array<FilterBarDimensionConfig<any>>;

export type DimensionConfigGenerator<T> = (
  translate: TranslationKeyToFormattedText,
) => SingleChoiceConfig<T>;

export const avatarFilterDimensions = [
  NonRAQIUIDimension.AvatarItemCategory,
  NonRAQIUIDimension.SalesType,
] as const;
export const recommendedEventsLiveEventsFilterDimensions = [
  NonRAQIUIDimension.LiveEventType,
  NonRAQIUIDimension.UserId,
  NonRAQIUIDimension.Text,
] as const;
export const ExperienceSubscriptionsDimensions = [NonRAQIUIDimension.Subscription] as const;
