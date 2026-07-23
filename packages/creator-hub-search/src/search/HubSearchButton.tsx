import type { ComponentProps } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import { ESearchInteraction } from '../eventStream/enum/DocsSiteSearch';
import useNavigationSearch from '../layout/topNavigation/hooks/useNavigationSearch';
import useHubSearchButtonStyles from './HubSearchButton.styles';
import { getSearchKeyboardShortcut } from './utils/getSearchKeyboardShortcut';

type ButtonProps = ComponentProps<typeof Button>;

export type HubSearchButtonProps = Omit<ButtonProps, 'onClick' | 'children'> & {
  /**
   * Whether to show the keyboard shortcut hint
   * @default true
   */
  showShortcut?: boolean;
  label?: string;
};

/**
 * HubSearchButton component - a prominent button that opens the search dialog.
 * Use this component on landing pages or other locations where a larger,
 * more visible search trigger is needed.
 *
 * Inherits all props from Button component (size, variant, color, className, etc.)
 *
 * @example
 * ```tsx
 * <NavigationSearchProvider>
 *   <HubSearchButton />
 *   <SearchContainer />
 * </NavigationSearchProvider>
 * ```
 */
export default function HubSearchButton({
  size = 'large',
  variant = 'contained',
  color = 'primaryBrand',
  className,
  showShortcut = true,
  label = '',
  ...buttonProps
}: HubSearchButtonProps) {
  const { classes, cx } = useHubSearchButtonStyles();
  const { translate } = useTranslation();
  const { setSearchDialogOpenWithEvent } = useNavigationSearch();

  const onSearchClick = useCallback(() => {
    setSearchDialogOpenWithEvent({
      searchDialogOpen: true,
      interaction: ESearchInteraction.LandingSearchButton,
    });
  }, [setSearchDialogOpenWithEvent]);

  const displyedLabel = label || translate('Label.SearchDocs') || 'Search Docs';

  return (
    <Button
      {...buttonProps}
      className={cx(classes.searchButton, className)}
      onClick={onSearchClick}
      size={size}
      variant={variant}
      color={color}
      aria-label={displyedLabel}>
      {showShortcut ? getSearchKeyboardShortcut(displyedLabel) : displyedLabel}
    </Button>
  );
}
