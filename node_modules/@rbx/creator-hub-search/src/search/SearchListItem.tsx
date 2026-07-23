// @refresh reset
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation, Locale } from '@rbx/intl';
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  OpenInNewIcon,
  Chip,
} from '@rbx/ui';
import {
  DocumentationDevForumSubType,
  DocumentationContentType,
} from '../clients/docSiteSearchType';
import { useSearchConfig } from '../contexts/SearchConfigContext';
import { ESearchInteraction } from '../eventStream/enum/DocsSiteSearch';
import { isInteractKey } from '../layout/layout/utils/keyboardNavigationHandler';
import useCurrentLocale from '../localization/hooks/useCurrentLocale';
import DynamicallyRouted from '../miscellaneous/common/components/DynamicallyRouted';
import Timestamp from '../miscellaneous/common/components/Timestamp';
import { getCreatorHubDocsBaseUrl } from '../utilities/getBasePaths';
import { ESearchNavigationElement, useSearchNavigation } from './hooks/useSearchNavigation';
import useSearchResultImpressionTracker from './hooks/useSearchResultImpressionTracker';
import type { TResultClickedInteraction } from './searchEvents';
import {
  isRealMouseClickEvent,
  getModifierKeyInteraction,
  isModifierKeyInteraction,
} from './searchEvents';
import { SvgIconKeyboardReturn } from './searchIcons';
import SearchItemIcon from './SearchItemIcon';
import useSearchListItemStyles from './SearchListItem.styles';
import type { EndAdornment } from './searchListItemUtils';
import {
  getSearchListItemLabelTranslated,
  getDefaultAriaLabel,
  hasSecondaryDisplayContent,
} from './searchListItemUtils';
import SecondaryDisplayText from './SecondaryDisplayText';
import type { TSearchListItem } from './types/SearchListItem';
import { sanitizeHighlightHtml } from './utils/sanitizeHighlightHtml';

// Re-export shared utils so existing consumers don't break
export type { EndAdornment } from './searchListItemUtils';
export {
  placeholderEndAdornment,
  getSearchListItemLabelTranslated,
  getSearchListItemTypeTranslated,
  getDefaultAriaLabel,
} from './searchListItemUtils';

export type SearchListItemProps = {
  item: TSearchListItem;
  className?: string;
  endAdornment: EndAdornment;
  locale?: Locale;
  onKeyboardModifierDetected?: (interaction: TResultClickedInteraction) => void;
};

export const SearchListItem = React.memo<SearchListItemProps>(
  ({ item, className, endAdornment, locale, onKeyboardModifierDetected }) => {
    const itemRef = useRef<HTMLLIElement>(null);
    const { onKeyDownSearch } = useSearchNavigation(itemRef);
    const [effectiveEndAdornment, setEffectiveEndAdornment] = useState<EndAdornment>(endAdornment);
    const { classes, cx } = useSearchListItemStyles({
      isSecondaryActionNonInteractive: !effectiveEndAdornment?.onClick,
    });
    const { translate } = useTranslation();
    const { robloxSiteDomain } = useSearchConfig();
    const baseUrl = getCreatorHubDocsBaseUrl(robloxSiteDomain);
    const itemLabel = useMemo(
      () => getSearchListItemLabelTranslated(item, translate),
      [item, translate],
    );

    const hasBreadcrumb = useMemo(() => hasSecondaryDisplayContent(item), [item]);

    // Titles and descriptions from the docs search backend may contain highlight
    // markup (e.g. <strong class="query-highlight">). They are sanitized before
    // being passed to dangerouslySetInnerHTML to prevent injection of arbitrary
    // HTML.
    const sanitizedTitleHtml = useMemo(() => sanitizeHighlightHtml(item.title), [item.title]);
    const sanitizedDescriptionHtml = useMemo(
      () => sanitizeHighlightHtml(item.description),
      [item.description],
    );

    const secondaryContent = (() => {
      if (hasBreadcrumb) {
        return (
          <Typography variant='body2' color='inherit' className={classes.listItemDescription}>
            <SecondaryDisplayText item={item} />
          </Typography>
        );
      }

      if (
        item.documentationSubType === DocumentationDevForumSubType.RobloxStaff ||
        item.documentationSubType === DocumentationDevForumSubType.CommunityResources ||
        item.documentationSubType === DocumentationDevForumSubType.CommunityTutorials
      ) {
        return (
          <Typography variant='body2' color='inherit' className={classes.listItemDescription}>
            {item.author?.name
              ? translate('Label.PostedBy', {
                  authorName: item.author?.name,
                })
              : ''}
          </Typography>
        );
      }

      // NOTE (neoxu, 2025-09-25): return timestamp only for DevForum content
      if (item.documentationSubType === DocumentationDevForumSubType.Announcements) {
        return (
          <Timestamp
            utcTime={item.updatedAtUtc}
            locale={locale ?? Locale.English}
            fallbackText={item.translatedCategoryDisplayText}
          />
        );
      }

      if (
        item.translatedCategoryDisplayText &&
        item.documentationContentType !== DocumentationContentType.CreatorHub
      ) {
        return (
          <Typography variant='body2' color='inherit' className={classes.listItemDescription}>
            {item.translatedCategoryDisplayText}
          </Typography>
        );
      }
      if (item.description) {
        return (
          <Typography
            variant='body2'
            color='inherit'
            className={classes.listItemDescription}
            // eslint-disable-next-line react/no-danger -- sanitized via sanitizeHighlightHtml.
            dangerouslySetInnerHTML={{ __html: sanitizedDescriptionHtml }}
          />
        );
      }
      if (itemLabel) {
        return (
          <Typography variant='body2' color='inherit' className={classes.listItemDescription}>
            {itemLabel}
          </Typography>
        );
      }
      return null;
    })();

    const onKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
      const modifierInteraction = getModifierKeyInteraction(e, true);
      if (isInteractKey(e)) {
        e.preventDefault();
        e.stopPropagation();

        if (
          isModifierKeyInteraction(modifierInteraction) &&
          onKeyboardModifierDetected &&
          item.path
        ) {
          onKeyboardModifierDetected(modifierInteraction);

          const targetUrl = item.path?.startsWith('http') ? item.path : `${baseUrl}${item.path}`;
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
          return;
        }

        itemRef.current?.click();
      } else {
        onKeyDownSearch(e);
      }
    };

    const onFocus = () => {
      setEffectiveEndAdornment({
        Icon: SvgIconKeyboardReturn,
      });
    };

    const onBlur = () => {
      setEffectiveEndAdornment(endAdornment);
    };

    return (
      <ListItem
        key={item.id}
        ref={itemRef}
        tabIndex={0}
        data-search-navigation-element={ESearchNavigationElement.ListItem}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        componentsProps={{
          root: {
            className: cx(classes.listItem, className),
          },
        }}>
        <ListItemIcon className={classes.listItemIcon} aria-hidden='true'>
          <div className={classes.iconContainer}>
            <SearchItemIcon item={item} />
          </div>
        </ListItemIcon>
        <ListItemText
          className={classes.listItemText}
          primaryTypographyProps={{
            color: 'inherit',
            className: classes.listItemPrimaryText,
          }}
          primary={
            <>
              <Typography
                variant={item.isTitleCode ? 'codeDense' : 'body2'}
                component='span'
                color='primary'
                className={classes.listItemTitle}
                aria-label={translate('Label.Title')}
                // eslint-disable-next-line react/no-danger -- sanitized via sanitizeHighlightHtml.
                dangerouslySetInnerHTML={{ __html: sanitizedTitleHtml }}
              />
              {!hasBreadcrumb && (
                <div className={classes.titleAdornmentWrapper}>
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment -- `deprecated` lives on TSearchResult, not TSearchListItem. */}
                  {/* @ts-expect-error -- see above */}
                  {item.deprecated && (
                    <Chip
                      label={translate('Label.Deprecated') || 'Deprecated'}
                      className={classes.titleAdornment}
                      size='small'
                      color='secondary'
                      variant='outlined'
                    />
                  )}
                </div>
              )}
            </>
          }
          secondary={secondaryContent}
        />
        <ListItemSecondaryAction className={classes.listItemSecondaryAction}>
          {effectiveEndAdornment.onClick || effectiveEndAdornment.onKeyDown ? (
            <IconButton
              edge='end'
              size='small'
              color='inherit'
              aria-label={effectiveEndAdornment.label ?? ''}
              onClick={effectiveEndAdornment.onClick}
              onKeyDown={effectiveEndAdornment.onKeyDown}>
              <effectiveEndAdornment.Icon fontSize='small' color='inherit' aria-hidden='true' />
            </IconButton>
          ) : (
            <effectiveEndAdornment.Icon fontSize='small' color='inherit' aria-hidden='true' />
          )}
        </ListItemSecondaryAction>
      </ListItem>
    );
  },
);

SearchListItem.displayName = 'SearchListItem';

export interface SearchResultImpressionContext {
  searchSessionId: string;
  query: string;
  rank: number;
}

export type SearchListItemLinkWrapperProps = SearchListItemProps & {
  onClickItem: (item: TSearchListItem, interaction: TResultClickedInteraction) => void;
  ariaLabel?: string;
  impressionContext?: SearchResultImpressionContext;
};

export const SearchListItemLink = React.memo<SearchListItemLinkWrapperProps>(
  ({ item, onClickItem, className, ariaLabel, endAdornment, impressionContext }) => {
    const { translate } = useTranslation();
    const { targetLocale } = useCurrentLocale();
    const { currentProduct, eventLogger } = useSearchConfig();
    const linkRef = useRef<HTMLDivElement>(null);

    useSearchResultImpressionTracker(
      linkRef,
      eventLogger,
      impressionContext
        ? {
            currentProduct,
            locale: targetLocale,
            query: impressionContext.query,
            rank: impressionContext.rank,
            resultCategory: item.documentationContentType ?? '',
            resultTitle: item.title,
            resultUrl: item.path ?? '',
            searchSessionId: impressionContext.searchSessionId,
          }
        : null,
    );

    const handleKeyboardModifierDetected = (interaction: TResultClickedInteraction) => {
      onClickItem(item, interaction);
    };

    const itemLabel = useMemo(
      () => getSearchListItemLabelTranslated(item, translate),
      [item, translate],
    );

    // Store results open in the same tab (no "open in new" icon); regular
    // external (http) doc results keep their new-tab behavior + icon.
    const isStoreItem = item.documentationContentType === DocumentationContentType.Store;
    const shouldOpenInNewTab = !isStoreItem && item.path?.startsWith('http');
    const effectiveEndAdornment = shouldOpenInNewTab ? { Icon: OpenInNewIcon } : endAdornment;

    const onClickItemLink = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (isRealMouseClickEvent(e)) {
        const modifierInteraction = getModifierKeyInteraction(e, false);
        onClickItem(item, modifierInteraction);
      } else {
        onClickItem(item, ESearchInteraction.KeyboardEnter);
      }
    };

    return (
      <div ref={linkRef}>
        <DynamicallyRouted.Link
          tabIndex={-1}
          href={item.path ?? ''}
          onClick={onClickItemLink}
          isDocSiteUrl={item.documentationContentType !== DocumentationContentType.CreatorHub}
          skipLocalePrefix
          target={shouldOpenInNewTab ? '_blank' : undefined}
          rel={shouldOpenInNewTab ? 'noopener noreferrer' : undefined}
          aria-label={ariaLabel ?? getDefaultAriaLabel(item, itemLabel, translate)}
          style={{ textDecoration: 'none', color: 'inherit' }}>
          <SearchListItem
            item={item}
            className={className}
            endAdornment={effectiveEndAdornment}
            locale={targetLocale}
            onKeyboardModifierDetected={handleKeyboardModifierDetected}
          />
        </DynamicallyRouted.Link>
      </div>
    );
  },
);

SearchListItemLink.displayName = 'SearchListItemLink';
