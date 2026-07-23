// Events are PascalCase
// Use alphabetical order
export enum ESearchEventName {
  DialogClosed = 'DocsSearch_DialogClosed',
  DialogOpened = 'DocsSearch_DialogOpened',
  Performed = 'DocsSearch_Performed',
  ResultClicked = 'DocsSearch_ResultClicked',

  // (2025/08) Begin Search UI Improvements Events
  // -- Assistant
  AskAssistantClicked = 'DocsSearch_AskAssistant_Clicked',
  AskAssistantImpression = 'DocsSearch_AskAssistant_Impression',
  // -- Category
  CategoryClicked = 'DocsSearch_Category_Clicked',
  CategoryCleared = 'DocsSearch_Category_Cleared',
  // -- Query
  QueryCleared = 'DocsSearch_Query_Cleared',
  // -- Recently Visited
  RecentlyVisitedClicked = 'DocsSearch_RecentlyVisited_Clicked',
  RecentlyVisitedDeleted = 'DocsSearch_RecentlyVisited_Deleted',
  RecentlyVisitedImpression = 'DocsSearch_RecentlyVisited_Impression',
  // -- Recommendations
  RecommendationClicked = 'DocsSearch_RecommendedSearch_Clicked',
  RecommendationImpression = 'DocsSearch_RecommendedSearch_Impression',
  // (2025/08) End Search UI Improvements Events

  // (2026/03) Search result item impression
  ResultItemImpression = 'DocsSearch_ResultItem_Impression',
}

export enum ESearchSource {
  Search = 'search', // for legacy
  SearchResults = 'searchResults', // for legacy
}

export enum ESearchInteraction {
  ClearQueryButton = 'clearQueryButton',
  Click = 'click',
  ClickCategoryPill = 'click:categoryPill',
  ClickCategoryTitle = 'click:categoryTitle',
  ClickWithCtrl = 'click:ctrl',
  ClickWithCmd = 'click:cmd',
  Input = 'input',
  KeyboardBackspace = 'kbBackspace',
  KeyboardEnter = 'kbEnter',
  KeyboardEnterWithCtrl = 'kbEnter:ctrl',
  KeyboardEnterWithCmd = 'kbEnter:cmd',
  KeyboardEnterCategoryPill = 'kbEnter:categoryPill',
  KeyboardEnterCategoryTitle = 'kbEnter:categoryTitle',
  KeyboardEscape = 'kbEscape',
  ModalClickOut = 'modalClickOut',
  LandingSearchButton = 'landingSearchButton',
  SearchCompleted = 'searchCompleted',
  NavSearchIcon = 'navSearchIcon',
  Shortcut = 'shortcut',
}
