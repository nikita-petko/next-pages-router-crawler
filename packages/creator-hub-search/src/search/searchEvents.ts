import { Locale } from '@rbx/intl';
import type { UnifiedLogger } from '@rbx/unified-logger';
import {
  DocumentationContentType,
  getDisplayCategory,
  SearchDisplayCategory,
} from '../clients/docSiteSearchType';
import {
  ESearchEventName,
  ESearchInteraction,
  ESearchSource,
} from '../eventStream/enum/DocsSiteSearch';
import { TSearchListItem } from './types/SearchListItem';
import { TSearchResult } from './types/SearchResult';
import { SEARCH_DISPLAY_CATEGORIES, LEARN_SUBCATEGORY_CHIPS } from './utils/searchCategories';

const filterResultsForCategory = (
  searchResults: TSearchResult[],
  category: string,
): TSearchResult[] => {
  const isDisplayCategory = SEARCH_DISPLAY_CATEGORIES.some((c) => c.value === category);
  if (isDisplayCategory) {
    return searchResults.filter(
      (r) => getDisplayCategory(r.documentationContentType) === (category as SearchDisplayCategory),
    );
  }
  return searchResults.filter((r) => r.documentationContentType === category);
};

export const isRealMouseClickEvent = (e: React.MouseEvent): boolean => {
  return e.isTrusted && e.detail > 0;
};

export type TDialogClosedInteraction =
  | ESearchInteraction.KeyboardEscape
  | ESearchInteraction.ModalClickOut
  | ESearchInteraction.SearchCompleted
  | ESearchInteraction.Shortcut;

export const trackSearchDialogClosed = ({
  eventLogger,
  interaction,
  locale,
  currentProduct,
  searchSessionId,
}: {
  eventLogger: UnifiedLogger;
  // TODO: lhoward (2025/08/18): make interaction required
  interaction?: TDialogClosedInteraction;
  locale: Locale;
  currentProduct: string;
  searchSessionId: string;
}) => {
  eventLogger.logClickEvent({
    eventName: ESearchEventName.DialogClosed,
    parameters: {
      locale,
      refPageUrl: window.location.pathname,
      currentProduct,
      searchSessionId,
      ...(interaction ? { interaction } : {}),
    },
  });
};

export type TDialogOpenedInteraction =
  | ESearchInteraction.LandingSearchButton
  | ESearchInteraction.Shortcut
  | ESearchInteraction.NavSearchIcon;

export const trackSearchDialogOpened = ({
  eventLogger,
  interaction,
  locale,
  currentProduct,
  searchSessionId,
}: {
  eventLogger: UnifiedLogger;
  // TODO: lhoward (2025/08/18): make interaction required
  interaction?: TDialogOpenedInteraction;
  locale: Locale;
  currentProduct: string;
  searchSessionId: string;
}) => {
  eventLogger.logClickEvent({
    eventName: ESearchEventName.DialogOpened,
    parameters: {
      locale,
      refPageUrl: window.location.pathname,
      currentProduct,
      searchSessionId,
      ...(interaction ? { interaction } : {}),
    },
  });
};

export type TPerformedInteraction = ESearchInteraction.Input;

export const trackSearchPerformed = ({
  eventLogger,
  category,
  interaction,
  isRecommended,
  isSemantic,
  locale,
  query,
  currentProduct,
  searchResults,
  searchSessionId,
}: {
  eventLogger: UnifiedLogger;
  category: DocumentationContentType;
  interaction: TPerformedInteraction;
  isRecommended: boolean;
  isSemantic: boolean;
  locale: Locale;
  query: string;
  currentProduct: string;
  searchResults: TSearchResult[];
  searchSessionId: string;
}) => {
  eventLogger.logClickEvent({
    eventName: ESearchEventName.Performed,
    parameters: {
      interaction,
      isRecommended: isRecommended.toString(),
      isSemantic: isSemantic.toString(),
      locale,
      numCategories: new Set(searchResults.map((r) => r.documentationContentType)).size.toString(),
      numResults: searchResults.length.toString(),
      query,
      refPageUrl: window.location.pathname,
      resultCategories: Array.from(
        new Set(searchResults.map((r) => r.documentationContentType)),
      ).join('|'),
      resultTitles: searchResults.map((r) => r.title).join('|'),
      resultUrls: searchResults.map((r) => r.url).join('|'),
      currentProduct,
      searchSessionId,
      source: ESearchSource.Search,
      topicFilters: '',
      typeFilter: category.toString(),
    },
  });
};

export type TClickedInteraction =
  | ESearchInteraction.Click
  | ESearchInteraction.ClickWithCtrl
  | ESearchInteraction.ClickWithCmd
  | ESearchInteraction.KeyboardEnter
  | ESearchInteraction.KeyboardEnterWithCtrl
  | ESearchInteraction.KeyboardEnterWithCmd;

export type TResultClickedInteraction = TClickedInteraction;

/**
 * Detects if a modifier key (Ctrl on Windows/Linux, Cmd on Mac) was pressed during the event
 * @param e - Mouse or keyboard event
 * @param isKeyboardEvent - Whether this is a keyboard event (affects return type)
 * @returns The specific interaction type based on the modifier key pressed and event type
 */
export const getModifierKeyInteraction = (
  e: React.MouseEvent | React.KeyboardEvent,
  isKeyboardEvent = false,
): TResultClickedInteraction => {
  if (e.metaKey) {
    return isKeyboardEvent
      ? ESearchInteraction.KeyboardEnterWithCmd
      : ESearchInteraction.ClickWithCmd;
  }

  if (e.ctrlKey) {
    return isKeyboardEvent
      ? ESearchInteraction.KeyboardEnterWithCtrl
      : ESearchInteraction.ClickWithCtrl;
  }

  if (isKeyboardEvent) {
    return ESearchInteraction.KeyboardEnter;
  }

  return ESearchInteraction.Click;
};

export const isModifierKeyInteraction = (interaction: TResultClickedInteraction): boolean => {
  return (
    interaction === ESearchInteraction.ClickWithCtrl ||
    interaction === ESearchInteraction.ClickWithCmd ||
    interaction === ESearchInteraction.KeyboardEnterWithCtrl ||
    interaction === ESearchInteraction.KeyboardEnterWithCmd
  );
};

export const trackSearchResultClicked = ({
  eventLogger,
  category,
  interaction,
  isRecommended,
  locale,
  query,
  currentProduct,
  searchResult,
  searchResults,
  searchSessionId,
}: {
  eventLogger: UnifiedLogger;
  category: DocumentationContentType;
  interaction: TResultClickedInteraction;
  isRecommended: boolean;
  locale: Locale;
  query: string;
  currentProduct: string;
  searchResult: TSearchResult;
  searchResults: TSearchResult[];
  searchSessionId: string;
}) => {
  eventLogger.logClickEvent({
    eventName: ESearchEventName.ResultClicked,
    parameters: {
      interaction,
      isRecommended: isRecommended.toString(),
      isSemantic: (!!searchResult.isSemantic).toString(),
      locale,
      query,
      rank: searchResults.indexOf(searchResult).toString(),
      refPageUrl: window.location.pathname,
      resultTitle: searchResult.title,
      resultUrl: searchResult.url,
      currentProduct,
      searchSessionId,
      source: ESearchSource.SearchResults,
      topicFilters: '', // legacy
      typeFilter: category.toString(),
    },
  });
};

// lhoward (2025/08/15): New events for the Search UI Improvements are below

export type TAskAssistantClickedInteraction =
  | ESearchInteraction.Click
  | ESearchInteraction.KeyboardEnter;

export const trackSearchAskAssistantClicked = ({
  eventLogger,
  askAssistantLabel,
  interaction,
  locale,
  query,
  currentProduct,
  searchSessionId,
  searchResults,
}: {
  eventLogger: UnifiedLogger;
  askAssistantLabel: string;
  interaction: TAskAssistantClickedInteraction;
  locale: Locale;
  query: string;
  currentProduct: string;
  searchSessionId: string;
  searchResults: TSearchResult[];
}) => {
  eventLogger.logClickEvent({
    eventName: ESearchEventName.AskAssistantClicked,
    parameters: {
      askAssistantLabel,
      interaction,
      locale,
      query,
      refPageUrl: window.location.pathname,
      currentProduct,
      searchSessionId,
      numResults: searchResults.length.toString(),
    },
  });
};

export const trackSearchAskAssistantImpression = ({
  eventLogger,
  askAssistantLabel,
  locale,
  query,
  currentProduct,
  searchSessionId,
  searchResults,
}: {
  eventLogger: UnifiedLogger;
  askAssistantLabel: string;
  locale: Locale;
  query: string;
  currentProduct: string;
  searchSessionId: string;
  searchResults: TSearchResult[];
}) => {
  eventLogger.logImpressionEvent({
    eventName: ESearchEventName.AskAssistantImpression,
    parameters: {
      askAssistantLabel,
      locale,
      query,
      refPageUrl: window.location.pathname,
      currentProduct,
      searchSessionId,
      numResults: searchResults.length.toString(),
    },
  });
};

export type TCategoryClickedInteraction =
  | ESearchInteraction.ClickCategoryTitle
  | ESearchInteraction.KeyboardEnterCategoryTitle
  | ESearchInteraction.ClickCategoryPill
  | ESearchInteraction.KeyboardEnterCategoryPill;

export const trackSearchCategoryClicked = ({
  eventLogger,
  category,
  interaction,
  isRecommended,
  locale,
  query,
  currentProduct,
  searchResults,
  searchSessionId,
}: {
  eventLogger: UnifiedLogger;
  category: DocumentationContentType;
  interaction: TCategoryClickedInteraction;
  isRecommended: boolean;
  locale: Locale;
  query: string;
  currentProduct: string;
  searchResults: TSearchResult[];
  searchSessionId: string;
}) => {
  const filteredResults = filterResultsForCategory(searchResults, category as string);
  const filteredCategories = Array.from(
    new Set(filteredResults.map((r) => r.documentationContentType)),
  );
  const displayIndex = SEARCH_DISPLAY_CATEGORIES.findIndex((c) => c.value === (category as string));
  const subcategoryIndex = LEARN_SUBCATEGORY_CHIPS.findIndex((c) => c.value === category);
  const positionIndex = displayIndex !== -1 ? displayIndex : subcategoryIndex;
  eventLogger.logClickEvent({
    eventName: ESearchEventName.CategoryClicked,
    parameters: {
      interaction,
      isRecommended: isRecommended.toString(),
      locale,
      numCategories: filteredCategories.length.toString(),
      numResults: filteredResults.length.toString(),
      query,
      positionIndex: positionIndex.toString(),
      refPageUrl: window.location.pathname,
      resultCategories: filteredCategories.join('|'),
      currentProduct,
      searchSessionId,
      typeFilter: category.toString(),
    },
  });
};

export type TCategoryClearedInteraction =
  | ESearchInteraction.ClickCategoryPill
  | ESearchInteraction.ClickCategoryTitle
  | ESearchInteraction.KeyboardEnterCategoryPill
  | ESearchInteraction.KeyboardEnterCategoryTitle
  | ESearchInteraction.KeyboardBackspace
  | ESearchInteraction.ClearQueryButton;

export const trackSearchCategoryCleared = ({
  eventLogger,
  category,
  interaction,
  isRecommended,
  locale,
  query,
  currentProduct,
  searchResults,
  searchSessionId,
}: {
  eventLogger: UnifiedLogger;
  category: DocumentationContentType;
  interaction: TCategoryClearedInteraction;
  isRecommended: boolean;
  locale: Locale;
  query: string;
  currentProduct: string;
  searchResults: TSearchResult[];
  searchSessionId: string;
}) => {
  const numResults = filterResultsForCategory(searchResults, category as string).length;
  eventLogger.logClickEvent({
    eventName: ESearchEventName.CategoryCleared,
    parameters: {
      interaction,
      isRecommended: isRecommended.toString(),
      locale,
      numResults: numResults.toString(),
      query,
      refPageUrl: window.location.pathname,
      currentProduct,
      searchSessionId,
      typeFilter: category.toString(),
    },
  });
};

export type TQueryClearedInteraction = ESearchInteraction.Click;

export const trackSearchQueryCleared = ({
  eventLogger,
  category,
  interaction,
  isRecommended,
  locale,
  query,
  currentProduct,
  searchResults,
  searchSessionId,
}: {
  eventLogger: UnifiedLogger;
  category: DocumentationContentType;
  interaction: TQueryClearedInteraction;
  isRecommended: boolean;
  locale: Locale;
  query: string;
  currentProduct: string;
  searchResults: TSearchResult[];
  searchSessionId: string;
}) => {
  eventLogger.logClickEvent({
    eventName: ESearchEventName.QueryCleared,
    parameters: {
      interaction,
      isRecommended: isRecommended.toString(),
      locale,
      numResults: searchResults.length.toString(),
      query,
      refPageUrl: window.location.pathname,
      currentProduct,
      searchSessionId,
      typeFilter: category.toString(),
    },
  });
};

export type TRecentlyVisitedClickedInteraction = TClickedInteraction;

export const trackSearchRecentlyVisitedClicked = ({
  eventLogger,
  interaction,
  item,
  locale,
  recentlyVisited,
  currentProduct,
  searchSessionId,
}: {
  eventLogger: UnifiedLogger;
  interaction: TRecentlyVisitedClickedInteraction;
  item: TSearchListItem;
  locale: Locale;
  recentlyVisited: TSearchListItem[];
  currentProduct: string;
  searchSessionId: string;
}) => {
  eventLogger.logClickEvent({
    eventName: ESearchEventName.RecentlyVisitedClicked,
    parameters: {
      interaction,
      locale,
      numVisited: recentlyVisited.length.toString(),
      rank: recentlyVisited.indexOf(item).toString(),
      refPageUrl: window.location.pathname,
      currentProduct,
      searchSessionId,
      visitedTitle: item.title,
      visitedUrl: item.path ?? '',
    },
  });
};

export type TRecentlyVisitedDeletedInteraction =
  | ESearchInteraction.Click
  | ESearchInteraction.KeyboardEnter;

export const trackSearchRecentlyVisitedDeleted = ({
  eventLogger,
  interaction,
  item,
  locale,
  recentlyVisited,
  currentProduct,
  searchSessionId,
}: {
  eventLogger: UnifiedLogger;
  interaction: TRecentlyVisitedDeletedInteraction;
  item: TSearchListItem;
  locale: Locale;
  recentlyVisited: TSearchListItem[];
  currentProduct: string;
  searchSessionId: string;
}) => {
  eventLogger.logClickEvent({
    eventName: ESearchEventName.RecentlyVisitedDeleted,
    parameters: {
      interaction,
      locale,
      numVisited: recentlyVisited.length.toString(),
      rank: recentlyVisited.indexOf(item).toString(),
      refPageUrl: window.location.pathname,
      currentProduct,
      searchSessionId,
      visitedTitle: item.title,
      visitedUrl: item.path ?? '',
    },
  });
};

export const trackSearchRecentlyVisitedImpression = ({
  eventLogger,
  locale,
  recentlyVisited,
  currentProduct,
  searchSessionId,
}: {
  eventLogger: UnifiedLogger;
  locale: Locale;
  recentlyVisited: TSearchListItem[];
  currentProduct: string;
  searchSessionId: string;
}) => {
  eventLogger.logImpressionEvent({
    eventName: ESearchEventName.RecentlyVisitedImpression,
    parameters: {
      locale,
      numVisited: recentlyVisited.length.toString(),
      refPageUrl: window.location.pathname,
      currentProduct,
      searchSessionId,
      visitedTitles: recentlyVisited.map((r) => r.title).join('|'),
      visitedUrls: recentlyVisited.map((r) => r.path).join('|'),
    },
  });
};

export type TRecommendationClickedInteraction =
  | ESearchInteraction.Click
  | ESearchInteraction.KeyboardEnter;

export const trackSearchRecommendationClicked = ({
  eventLogger,
  interaction,
  locale,
  query,
  recommendation,
  currentProduct,
  searchSessionId,
}: {
  eventLogger: UnifiedLogger;
  interaction: TRecommendationClickedInteraction;
  locale: Locale;
  query: string;
  recommendation: string;
  currentProduct: string;
  searchSessionId: string;
}) => {
  eventLogger.logClickEvent({
    eventName: ESearchEventName.RecommendationClicked,
    parameters: {
      interaction,
      locale,
      query,
      recommendation,
      refPageUrl: window.location.pathname,
      currentProduct,
      searchSessionId,
    },
  });
};

export const trackSearchRecommendationImpression = ({
  eventLogger,
  locale,
  query,
  recommendation,
  currentProduct,
  searchSessionId,
}: {
  eventLogger: UnifiedLogger;
  locale: Locale;
  query: string;
  recommendation: string;
  currentProduct: string;
  searchSessionId: string;
}) => {
  eventLogger.logImpressionEvent({
    eventName: ESearchEventName.RecommendationImpression,
    parameters: {
      locale,
      query,
      recommendation,
      refPageUrl: window.location.pathname,
      currentProduct,
      searchSessionId,
    },
  });
};
