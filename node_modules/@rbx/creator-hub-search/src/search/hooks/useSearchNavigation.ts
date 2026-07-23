import { useCallback } from 'react';

export enum NavigateList {
  Up = 'up',
  Down = 'down',
}

export enum SearchableContainer {
  List = 'data-list-container',
  Chips = 'data-filter-chips-container',
}

export enum ESearchNavigationElement {
  ListItem = 'list-item',
  Chip = 'chip',
}

export const SEARCH_INPUT_ID = 'search-input';

// Type-safe selectors
export const SELECTORS = {
  searchInput: `#${SEARCH_INPUT_ID}`,
  listItems: `[${SearchableContainer.List}] [data-search-navigation-element="${ESearchNavigationElement.ListItem}"]`,
  chips: `[${SearchableContainer.Chips}] [data-search-navigation-element="${ESearchNavigationElement.Chip}"]`,
  allFocusable: `[${SearchableContainer.List}] [data-search-navigation-element="${ESearchNavigationElement.ListItem}"], [${SearchableContainer.Chips}] [data-search-navigation-element="${ESearchNavigationElement.Chip}"]`,
} as const;

// Helper functions for type-safe DOM queries
export const searchNavigationDomQueries = {
  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  getSearchInput: () => document.querySelector(SELECTORS.searchInput) as HTMLElement | null,
  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  getListItems: () => Array.from(document.querySelectorAll(SELECTORS.listItems)) as HTMLElement[],
  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  getChips: () => Array.from(document.querySelectorAll(SELECTORS.chips)) as HTMLElement[],
  getAllFocusable: () =>
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    Array.from(document.querySelectorAll(SELECTORS.allFocusable)) as HTMLElement[],
  isListItem: (element: HTMLElement) => element.closest(`[${SearchableContainer.List}]`),
  isChip: (element: HTMLElement) => element.closest(`[${SearchableContainer.Chips}]`),
} as const;

export const useSearchNavigation = (itemRef: React.RefObject<HTMLElement | null>) => {
  const navigateSearch = useCallback(
    (direction: NavigateList) => {
      const currentItem = itemRef.current;
      if (!currentItem) {
        return;
      }

      // Get all focusable items in the entire dialog
      const allItems = searchNavigationDomQueries.getAllFocusable();

      // Find the current item
      const currentIndex = allItems.findIndex((item) => {
        return item === currentItem || currentItem.contains(item);
      });

      if (currentIndex === -1) {
        return;
      }

      let nextIndex: number;
      if (direction === NavigateList.Up) {
        // Check if current item is a list item (search result)
        const isListItem = searchNavigationDomQueries.isListItem(currentItem);

        if (isListItem) {
          // Get only the list items to find the correct first index
          const listItems = searchNavigationDomQueries.getListItems();

          const listItemIndex = listItems.findIndex(
            (item) => item === currentItem || currentItem.contains(item),
          );

          // If we're at the first list item and pressing up, focus the search input
          if (listItemIndex === 0) {
            const searchInput = searchNavigationDomQueries.getSearchInput();
            if (searchInput) {
              searchInput.focus();
              return;
            }
          }
        }

        // For all other cases, navigate to previous item
        nextIndex = currentIndex > 0 ? currentIndex - 1 : allItems.length - 1;
      } else {
        // Check if current item is a list item (search result)
        const isListItem = searchNavigationDomQueries.isListItem(currentItem);

        if (isListItem) {
          // Get only the list items to find the correct last index
          const listItems = searchNavigationDomQueries.getListItems();

          const listItemIndex = listItems.findIndex(
            (item) => item === currentItem || currentItem.contains(item),
          );

          // If we're at the last list item and pressing down, check if there are chips below
          if (listItemIndex === listItems.length - 1) {
            // Check if there are any chips after the current item in the allItems array
            const currentItemIndexInAllItems = allItems.findIndex(
              (item) => item === currentItem || currentItem.contains(item),
            );

            // Look for chips after the current item
            const chipsAfterCurrent = allItems
              .slice(currentItemIndexInAllItems + 1)
              .find((item) => searchNavigationDomQueries.isChip(item));

            if (chipsAfterCurrent) {
              // If there are chips below, go to the first chip
              chipsAfterCurrent.focus();
              return;
            }

            // No chips below: return focus to the search input, consistent with
            // pressing down past the last filter chip.
            const searchInput = searchNavigationDomQueries.getSearchInput();
            if (searchInput) {
              searchInput.focus();
              return;
            }
          }
        }

        // Check if current item is a chip
        const isChip = searchNavigationDomQueries.isChip(currentItem);

        if (isChip) {
          // Get only the chips to find the correct last index
          const chips = searchNavigationDomQueries.getChips();

          const chipIndex = chips.findIndex(
            (item) => item === currentItem || currentItem.contains(item),
          );

          // If we're at the last chip and pressing down, focus the search input
          if (chipIndex === chips.length - 1) {
            const searchInput = searchNavigationDomQueries.getSearchInput();
            if (searchInput) {
              searchInput.focus();
              return;
            }
          }
        }

        // For all other cases, navigate to next item
        nextIndex = currentIndex < allItems.length - 1 ? currentIndex + 1 : 0;
      }

      allItems[nextIndex]?.focus();
    },
    [itemRef],
  );

  const onKeyDownSearch = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateSearch(NavigateList.Up);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateSearch(NavigateList.Down);
      }
    },
    [navigateSearch],
  );

  return { onKeyDownSearch };
};
