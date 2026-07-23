import type { EducationalTooltipContent } from '@rbx/foundation-ui';
import type { ComponentProps } from 'react';

import { TranslationNamespace } from '@constants/localization';
import { ReportingViewDocsUrl } from '@constants/reportingUrls';

type EducationalTooltipPosition = ComponentProps<typeof EducationalTooltipContent>['position'];

/**
 * Full static definition of a dismissible educational tooltip. Each tooltip
 * is declared exactly once in `Tooltips` below; every other view of a
 * tooltip (its `localStorage` key, its priority in the global sequence, its
 * copy, its presentation defaults) is a projection of fields on this type.
 *
 * Copy fields are translation *keys* (passed to `useTranslation`'s
 * `translate`), not resolved strings, because resolution is hook-bound and
 * happens inside `DismissibleTooltip`.
 *
 * Field order below is alphabetical to satisfy `perfectionist/sort-interfaces`.
 * The conceptual groups are: identity (`priority`, `storageKey`), copy
 * (`closeLabelKey`, `descriptionKey`, `headingKey`), and presentation
 * (`dismissOnOutsideInteraction`, `position`).
 */
export interface TooltipConfiguration {
  /** Translation key for the primary dismiss button label. */
  closeLabelKey: string;
  /**
   * Namespace the `closeLabelKey` resolves from. Close labels are generic
   * button strings (e.g. `Action.OK`) that often live in a different
   * namespace than the tooltip's own heading/description copy, so they are
   * bound separately.
   */
  closeLabelNamespace: TranslationNamespace;
  /** Translation key for the tooltip's body copy. */
  descriptionKey: string;
  /**
   * When set, the description string is rendered through `translateHTML` and
   * any `{aStart}…{aEnd}` placeholder pair in the resolved copy is wrapped in
   * an external `<Link>` pointing at this URL (opens in a new tab,
   * `rel="noopener noreferrer"`). When omitted the description renders as
   * plain text and no link is produced even if the source string happens to
   * contain `{aStart}…{aEnd}` markers — that combination would render the
   * markers as literal text, so only declare a description with markers
   * alongside this URL.
   */
  descriptionLinkUrl?: string;
  /**
   * When true, clicking outside the tooltip or pressing Escape dismisses it
   * and persists the dismissal. Set to false for tooltips whose anchor
   * element itself has hover / click affordances that would otherwise cause
   * accidental dismissal.
   */
  dismissOnOutsideInteraction: boolean;
  /** Translation key for the tooltip's heading. */
  headingKey: string;
  /**
   * Namespace the `headingKey` and `descriptionKey` resolve from. Both share
   * the tooltip's feature namespace.
   */
  namespace: TranslationNamespace;
  /**
   * Position of the tooltip relative to its anchor.
   */
  position: EducationalTooltipPosition;
  /**
   * Global ordering for the sequential tooltip registry. Lower number shows
   * first when multiple tooltips want to be visible at the same time.
   */
  priority: number;
  /**
   * Stable `localStorage` key used to persist the "user has dismissed this
   * coachmark" flag. Must not change without a migration story for existing
   * users.
   */
  storageKey: string;
}

/**
 * Source of truth for every dismissible educational tooltip in the app.
 *
 * Adding a tooltip means adding a single record here — its storage key,
 * priority, copy, and presentation defaults all live together. Removing a
 * tooltip means deleting one record. There is no "register the priority in
 * one file, register the key in another" coordination cost.
 *
 * Entries are sorted alphabetically by key to satisfy
 * `perfectionist/sort-objects`; *display* order is encoded by the `priority`
 * field, not by position in this object. Leave gaps between priority values
 * so new tooltips can be inserted without renumbering existing entries.
 */
export const Tooltips = {
  AUTO_RELOAD_AD_CREDIT_COACH_MARK: {
    closeLabelKey: 'Action.GotIt',
    closeLabelNamespace: TranslationNamespace.Campaign,
    descriptionKey: 'Description.AutoReloadCoachMark',
    dismissOnOutsideInteraction: false,
    headingKey: 'Heading.NewAutoReload',
    namespace: TranslationNamespace.Campaign,
    position: 'right-end',
    priority: 300,
    storageKey: 'hasSeenAutoReloadAdCreditCoachMark',
  },
  CAMPAIGN_FORECASTER: {
    closeLabelKey: 'Action.OK',
    closeLabelNamespace: TranslationNamespace.CreativeLibrary,
    descriptionKey: 'Description.CampaignForecasterCoachMark',
    dismissOnOutsideInteraction: true,
    headingKey: 'Heading.CampaignForecasterCoachMark',
    namespace: TranslationNamespace.Forecast,
    position: 'right-end',
    priority: 500,
    storageKey: 'hasSeenForecasterEducationalTooltip',
  },
  CAMPAIGN_TABLE: {
    closeLabelKey: 'Action.OK',
    closeLabelNamespace: TranslationNamespace.CreativeLibrary,
    descriptionKey: 'Description.CampaignReportingAccuracyTooltip',
    dismissOnOutsideInteraction: false,
    headingKey: 'Heading.CampaignReportingAccuracyTooltip',
    namespace: TranslationNamespace.Campaign,
    position: 'top-center',
    priority: 200,
    storageKey: 'hasSeenCampaignTableTooltip',
  },
  CREATIVE_LIBRARY_NAV: {
    closeLabelKey: 'Action.OK',
    closeLabelNamespace: TranslationNamespace.CreativeLibrary,
    descriptionKey: 'Description.NewAssetLibraryTooltip',
    dismissOnOutsideInteraction: false,
    headingKey: 'Heading.NewAssetLibraryTooltip',
    namespace: TranslationNamespace.CreativeLibrary,
    // Beak points left toward the Creative Library nav rail item; the tooltip
    // sits to its right (see Figma 18936:106981).
    position: 'right-center',
    priority: 600,
    storageKey: 'hasSeenNewAssetLibraryTooltip',
  },
  GEN_AI_CREATE: {
    closeLabelKey: 'Action.OK',
    closeLabelNamespace: TranslationNamespace.CreativeLibrary,
    descriptionKey: 'Description.NewAiGenerateTooltip',
    dismissOnOutsideInteraction: false,
    headingKey: 'Heading.NewAiGenerateTooltip',
    namespace: TranslationNamespace.CreativeLibrary,
    // Beak points up at the Generate button; the tooltip drops below it,
    // right-aligned to the button (see Figma 18936:111490).
    position: 'bottom-end',
    priority: 700,
    storageKey: 'hasSeenNewAiGenerateTooltip',
  },
  REPORTING_VIEW: {
    closeLabelKey: 'Action.OK',
    closeLabelNamespace: TranslationNamespace.CreativeLibrary,
    descriptionKey: 'Description.ReportingViewTooltip',
    descriptionLinkUrl: ReportingViewDocsUrl,
    dismissOnOutsideInteraction: false,
    headingKey: 'Heading.ReportingViewTooltip',
    namespace: TranslationNamespace.Campaign,
    position: 'right-end',
    priority: 100,
    storageKey: 'hasSeenReportingViewTooltip',
  },
  RETENTION_CAMPAIGN: {
    closeLabelKey: 'Action.OK',
    closeLabelNamespace: TranslationNamespace.CreativeLibrary,
    descriptionKey: 'Description.RetentionCampaignReportingTooltip',
    dismissOnOutsideInteraction: false,
    headingKey: 'Heading.RetentionCampaignReportingTooltip',
    namespace: TranslationNamespace.Campaign,
    position: 'top-center',
    priority: 400,
    storageKey: 'hasSeenRetentionCampaignTooltip',
  },
} as const satisfies Record<string, TooltipConfiguration>;
