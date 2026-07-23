import React, { useMemo } from 'react';
import { CloseIcon } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { isInteractKey } from '../layout/layout/utils/keyboardNavigationHandler';
import { ESearchInteraction } from '../eventStream/enum/DocsSiteSearch';
import {
  isRealMouseClickEvent,
  getModifierKeyInteraction,
  TResultClickedInteraction,
} from './searchEvents';
import { TSearchListItem } from './types/SearchListItem';
import {
  EndAdornment,
  getSearchListItemLabelTranslated,
  getDefaultAriaLabel,
} from './searchListItemUtils';
import { SearchListItem } from './SearchListItem';

export type RecentlyVisitedItemProps = {
  item: TSearchListItem;
  className?: string;
  onClickItem: (item: TSearchListItem, interaction: TResultClickedInteraction) => void;
  onRemove: (id: string) => void;
  ariaLabel?: string;
};

/**
 * Recently visited item that reuses SearchListItem for consistent visual
 * rendering with search results. Wraps it with a link and a remove button.
 */
export const RecentlyVisitedItem = React.memo<RecentlyVisitedItemProps>(
  ({ item, className, onClickItem, onRemove, ariaLabel }) => {
    const { translate } = useTranslation();

    const removeAdornment: EndAdornment = useMemo(() => {
      const handleRemoveClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        e.preventDefault();
        onRemove(item.id);
      };

      const handleRemoveKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (isInteractKey(e)) {
          onRemove(item.id);
        }
      };

      return {
        Icon: CloseIcon,
        label: translate('Label.RemoveFromRecentlyVisited', { title: item.title }) as string,
        onClick: handleRemoveClick,
        onKeyDown: handleRemoveKeyDown,
      };
    }, [item.id, item.title, onRemove, translate]);

    const onClickItemLink = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      if (isRealMouseClickEvent(e)) {
        const modifierInteraction = getModifierKeyInteraction(e, false);
        onClickItem(item, modifierInteraction);
      } else {
        onClickItem(item, ESearchInteraction.KeyboardEnter);
      }
    };

    const itemLabel = useMemo(
      () => getSearchListItemLabelTranslated(item, translate),
      [item, translate],
    );

    const computedAriaLabel = ariaLabel ?? getDefaultAriaLabel(item, itemLabel, translate);

    return (
      <a
        tabIndex={-1}
        href={item.path}
        onClick={onClickItemLink}
        aria-label={computedAriaLabel}
        style={{ textDecoration: 'none', color: 'inherit' }}>
        <SearchListItem item={item} className={className} endAdornment={removeAdornment} />
      </a>
    );
  },
);

RecentlyVisitedItem.displayName = 'RecentlyVisitedItem';
