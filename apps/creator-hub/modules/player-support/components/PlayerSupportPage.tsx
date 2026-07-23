import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useFlag } from '@rbx/flags';
import { Badge, Icon, ProgressCircle, Tabs, TabsList, TabsTrigger } from '@rbx/foundation-ui';
import type { Locale } from '@rbx/intl';
import { withTranslation, useTranslation } from '@rbx/intl';
import { useDebounce } from '@rbx/react-utilities';
import { useMediaQuery, type TTheme } from '@rbx/ui';
import { enablePlayerSupportSearchAndFilters } from '@generated/flags/creatorGameops';
import useLocale from '@modules/charts-generic/context/useLocale';
import GenericTablePagination from '@modules/charts-generic/tables/GenericTablePagination';
import { TicketStatus, type CreatorTicketSummary } from '@modules/clients/creatorCommunication';
import { getResponseFromError } from '@modules/clients/utils';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import LoadError from '@modules/miscellaneous/error/LoadError';
import useQueryParams from '@modules/miscellaneous/hooks/useQueryParams';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { formatDate } from '@modules/miscellaneous/utils/dateUtils';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import {
  isPlayerSupportCategoryFilter,
  isPlayerSupportViewFilter,
  PLAYER_SUPPORT_SEARCH_DEBOUNCE_DELAY_MS,
  PLAYER_SUPPORT_VIEW_FILTER_VALUES,
  PlayerSupportCategoryFilter,
  PlayerSupportViewFilter,
} from '../constants/ticketFilters';
import {
  hasTicketCategoryTranslationKey,
  TICKET_CATEGORY_TRANSLATION_KEY,
} from '../constants/ticketLabels';
import usePlayerSupportTicketsQuery from '../hooks/usePlayerSupportTicketsQuery';
import PlayerSupportSearchFilters from './PlayerSupportSearchFilters';
import TicketActionsMenu from './TicketActionsMenu';

const QUERY_PARAM_KEYS = ['pageToken', 'pageSize', 'status', 'query', 'view', 'category'] as const;
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const getPrevTokensStorageKey = (universeId: number, status: TicketStatus) =>
  `playerSupport:prevTokens:${universeId}:${status}`;

const readPrevTokens = (universeId: number, status: TicketStatus): string[] => {
  try {
    const raw = sessionStorage.getItem(getPrevTokensStorageKey(universeId, status));
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.every((t): t is string => typeof t === 'string') ? parsed : [];
  } catch {
    return [];
  }
};

const writePrevTokens = (universeId: number, status: TicketStatus, tokens: string[]) => {
  try {
    const key = getPrevTokensStorageKey(universeId, status);
    if (tokens.length === 0) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, JSON.stringify(tokens));
    }
  } catch {
    // sessionStorage may be unavailable (e.g. private browsing quota exceeded)
  }
};

const TicketRow: React.FunctionComponent<{
  ticket: CreatorTicketSummary;
  universeId: number;
  locale: Locale;
  onClick?: (ticketId: string, category?: string) => void;
}> = ({ ticket, universeId, locale, onClick }) => {
  const { translate } = useTranslation();
  const categoryKey =
    ticket.category && hasTicketCategoryTranslationKey(ticket.category)
      ? TICKET_CATEGORY_TRANSLATION_KEY[ticket.category]
      : undefined;
  const categoryLabel = categoryKey ? translate(categoryKey) : (ticket.category ?? '');
  const isReportedToRoblox = ticket?.reportedToRoblox === true;
  const displayTitle = isReportedToRoblox
    ? translate('Label.PlayerSupport.ContentHidden')
    : (ticket.title ?? '');

  const handleClick = () => {
    if (ticket.creatorTicketId) {
      onClick?.(ticket.creatorTicketId, ticket.category);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <tr
      className='group cursor-pointer height-1500 [border-bottom:var(--stroke-thin)_solid_var(--color-stroke-default)] last:[border-bottom:none] hover:bg-[var(--color-state-hover)]'
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={displayTitle}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a `<tr>` cannot be replaced with `<a>`; the row is intentionally clickable.
      role='link'
      tabIndex={0}>
      {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- the row is labeled via aria-label above; the visible title text is nested in an inner flex div, deeper than the rule's lookup depth. */}
      <td className='content-default text-body-medium max-width-0 padding-x-medium'>
        <div className='items-center min-width-0 gap-small flex'>
          <span className='items-center justify-center size-200 shrink-0 flex'>
            {!ticket.viewedByCreator && ticket.status !== TicketStatus.Archived && (
              <span className='bg-action-emphasis size-200 radius-circle' />
            )}
          </span>
          <div className='items-center min-width-0 gap-medium flex'>
            {isReportedToRoblox && (
              /* TODO: update this to 20% opacity when Foundation Web is updated. */
              <Badge
                label={translate('Label.PlayerSupport.ReportedByYou')}
                variant='Alert'
                icon='icon-filled-flag'
              />
            )}
            <span className='text-no-wrap text-truncate-end min-width-0'>{displayTitle}</span>
          </div>
        </div>
      </td>
      <td className='text-no-wrap padding-x-medium'>
        <Badge label={categoryLabel} variant='Neutral' className='height-600' />
      </td>
      <td className='content-muted text-body-medium text-no-wrap padding-x-medium'>
        {ticket.createTime ? formatDate(ticket.createTime, locale) : ''}
      </td>
      <td className='width-[1%] padding-x-medium'>
        {ticket.creatorTicketId && ticket.status !== TicketStatus.Archived && (
          <TicketActionsMenu
            universeId={universeId}
            ticketId={ticket.creatorTicketId}
            surface='list'
          />
        )}
      </td>
    </tr>
  );
};

const MobileTicketCard: React.FunctionComponent<{
  ticket: CreatorTicketSummary;
  universeId: number;
  locale: Locale;
  onClick?: (ticketId: string, category?: string) => void;
}> = ({ ticket, universeId, locale, onClick }) => {
  const { translate } = useTranslation();
  const categoryKey =
    ticket.category && hasTicketCategoryTranslationKey(ticket.category)
      ? TICKET_CATEGORY_TRANSLATION_KEY[ticket.category]
      : undefined;
  const categoryLabel = categoryKey ? translate(categoryKey) : (ticket.category ?? '');
  const isReportedToRoblox = ticket?.reportedToRoblox === true;
  const displayTitle = isReportedToRoblox
    ? translate('Label.PlayerSupport.ContentHidden')
    : (ticket.title ?? '');

  const handleClick = () => {
    if (ticket.creatorTicketId) {
      onClick?.(ticket.creatorTicketId, ticket.category);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- this card is intentionally a clickable row, not an `<a>`.
      role='link'
      aria-label={displayTitle}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className='cursor-pointer gap-medium flex flex-col'>
      <div className='bg-shift-300 padding-x-large padding-y-small radius-medium'>
        <div className='items-center justify-between gap-small flex'>
          <div className='items-center min-width-0 gap-large flex'>
            <span className='items-center justify-center size-200 shrink-0 flex'>
              {!ticket.viewedByCreator && ticket.status !== TicketStatus.Archived && (
                <span className='bg-action-emphasis size-200 radius-circle' />
              )}
            </span>
            <div className='items-start min-width-0 gap-xsmall flex flex-col'>
              {isReportedToRoblox && (
                /* TODO: update this to 20% opacity when Foundation Web is updated. */
                <Badge
                  label={translate('Label.PlayerSupport.ReportedByYou')}
                  variant='Alert'
                  icon='icon-filled-flag'
                />
              )}
              <span className='content-emphasis text-body-medium min-width-0 clip [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]'>
                {displayTitle}
              </span>
            </div>
          </div>
          {ticket.creatorTicketId && ticket.status !== TicketStatus.Archived ? (
            <TicketActionsMenu
              universeId={universeId}
              ticketId={ticket.creatorTicketId}
              alwaysVisible
              surface='list'
            />
          ) : (
            // Reserve the kebab's 32px footprint so archived cards keep the same
            // spacing (and title wrap width) as support-request cards.
            <span className='size-800 shrink-0' aria-hidden />
          )}
        </div>
      </div>
      <div className='padding-x-xxlarge gap-medium flex flex-col'>
        <div className='items-center justify-between flex'>
          <span className='content-emphasis text-body-medium'>{translate('Title.Table.Type')}</span>
          <Badge label={categoryLabel} variant='Neutral' />
        </div>
        <div className='items-center justify-between flex'>
          <span className='content-emphasis text-body-medium'>
            {translate('Title.Table.Created')}
          </span>
          <span className='content-default text-body-medium'>
            {ticket.createTime ? formatDate(ticket.createTime, locale) : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

const PlayerSupportPage: React.FunctionComponent = () => {
  const { translate } = useTranslation();
  const { gameDetails } = useCurrentGame();
  const universeId = gameDetails?.id ?? 0;
  const { value: isSearchAndFiltersEnabled } = useFlag(enablePlayerSupportSearchAndFilters);
  const isMobile = useMediaQuery((theme: TTheme) => theme.breakpoints.down('Medium'));
  const locale = useLocale();
  const router = useRouter();

  const [queryParams, setQueryParams] = useQueryParams(QUERY_PARAM_KEYS, {
    scroll: false,
  });

  const pageToken = typeof queryParams.pageToken === 'string' ? queryParams.pageToken : undefined;
  const pageSize = queryParams.pageSize ? Number(queryParams.pageSize) : DEFAULT_PAGE_SIZE;
  const selectedStatus =
    queryParams.status === TicketStatus.Archived ? TicketStatus.Archived : TicketStatus.NeedsAction;
  const query =
    isSearchAndFiltersEnabled && typeof queryParams.query === 'string' ? queryParams.query : '';
  const selectedView =
    isSearchAndFiltersEnabled && isPlayerSupportViewFilter(queryParams.view)
      ? queryParams.view
      : PlayerSupportViewFilter.All;
  const selectedCategory =
    isSearchAndFiltersEnabled && isPlayerSupportCategoryFilter(queryParams.category)
      ? queryParams.category
      : PlayerSupportCategoryFilter.All;
  const [searchState, setSearchState] = useState(() => ({
    externalValue: query,
    inputValue: query,
  }));
  if (query !== searchState.externalValue) {
    setSearchState({ externalValue: query, inputValue: query });
  }
  const search = searchState.inputValue;
  const debouncedQuery = useDebounce(search.trim(), PLAYER_SUPPORT_SEARCH_DEBOUNCE_DELAY_MS);
  const readFilter = PLAYER_SUPPORT_VIEW_FILTER_VALUES[selectedView];
  const categoryFilter =
    selectedCategory === PlayerSupportCategoryFilter.All ? undefined : selectedCategory;
  const hasActiveFilters =
    debouncedQuery.length > 0 ||
    selectedView !== PlayerSupportViewFilter.All ||
    selectedCategory !== PlayerSupportCategoryFilter.All;

  const [prevTokens, setPrevTokens] = useState<string[]>(() =>
    readPrevTokens(universeId, selectedStatus),
  );

  // Keep prevTokens in sync with the URL across browser back/forward and hard refreshes.
  // On hard refresh, universeId starts as 0 so useState reads the wrong sessionStorage key;
  // this effect re-reads once the real universeId is available.
  // Read the current length via a ref so this only re-runs for URL-driven inputs; otherwise
  // explicit next/prev clicks would race with the router (router.query updates async) and
  // wrongly rewind prevTokens before the URL catches up.
  const prevTokensRef = useRef(prevTokens);
  // oxlint-disable-next-line react/react-compiler -- intentional render-time ref sync so the effect below can read the latest prevTokens without listing it as a dependency (see comment above re: router race)
  prevTokensRef.current = prevTokens;
  useEffect(() => {
    const storedTokens = readPrevTokens(universeId, selectedStatus);
    const currentLength = prevTokensRef.current.length;
    if (!pageToken) {
      if (currentLength > 0) {
        setPrevTokens([]);
        writePrevTokens(universeId, selectedStatus, []);
      }
      return;
    }
    const idx = storedTokens.indexOf(pageToken);
    if (idx !== -1) {
      const corrected = storedTokens.slice(0, idx);
      if (corrected.length !== currentLength) {
        setPrevTokens(corrected);
        writePrevTokens(universeId, selectedStatus, corrected);
      }
    } else if (storedTokens.length !== currentLength) {
      setPrevTokens(storedTokens);
    }
  }, [pageToken, universeId, selectedStatus]);

  // Log a single page-view event once the experience id is available, regardless of
  // how the user arrived (left nav, direct link, in-app navigation).
  const hasLoggedPageViewRef = useRef(false);
  useEffect(() => {
    if (universeId > 0 && !hasLoggedPageViewRef.current) {
      hasLoggedPageViewRef.current = true;
      unifiedLoggerClient.logImpressionEvent({
        eventName: 'playerSupport.pageView',
        parameters: {
          universeId: String(universeId),
        },
      });
    }
  }, [universeId]);

  const { data, isPending, isPlaceholderData, error, refetch } = usePlayerSupportTicketsQuery({
    universeId,
    status: selectedStatus,
    query: debouncedQuery || undefined,
    readFilter,
    category: categoryFilter,
    pageToken,
    pageSize,
    shouldKeepPreviousData: true,
  });

  const isNotFoundError = getResponseFromError(error)?.status === 404;

  const tickets = data?.creatorTicketSummaries ?? [];
  const nextPageToken = data?.nextPageToken;

  // ES can return a nextPageToken even when the following page has no results.
  // Prefetch that page and only enable forward pagination when it has results.
  const { data: nextPageData } = usePlayerSupportTicketsQuery({
    universeId,
    status: selectedStatus,
    query: debouncedQuery || undefined,
    readFilter,
    category: categoryFilter,
    pageToken: nextPageToken,
    pageSize,
    enabled: !!nextPageToken && !isPlaceholderData,
  });

  const hasNextPage = !!nextPageToken && (nextPageData?.creatorTicketSummaries ?? []).length > 0;

  const resetPagination = useCallback(() => {
    writePrevTokens(universeId, selectedStatus, []);
    setPrevTokens([]);
  }, [selectedStatus, universeId]);

  const handleNextPage = useCallback(() => {
    if (!nextPageToken) {
      return;
    }
    setPrevTokens((prev) => {
      const next = [...prev, pageToken ?? ''];
      writePrevTokens(universeId, selectedStatus, next);
      return next;
    });
    setQueryParams({ pageToken: nextPageToken });
  }, [nextPageToken, pageToken, setQueryParams, universeId, selectedStatus]);

  const handlePrevPage = useCallback(() => {
    setPrevTokens((prev) => {
      const next = [...prev];
      const token = next.pop();
      writePrevTokens(universeId, selectedStatus, next);
      const prevPageToken = token === undefined || token === '' ? null : token;
      setQueryParams({ pageToken: prevPageToken });
      return next;
    });
  }, [setQueryParams, universeId, selectedStatus]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchState((current) => ({ ...current, inputValue: value }));
      resetPagination();
      setQueryParams(
        {
          query: value.trim().length > 0 ? value : null,
          pageToken: null,
        },
        { skipHistory: true },
      );
    },
    [resetPagination, setQueryParams],
  );

  const handleViewChange = useCallback(
    (value: typeof selectedView) => {
      resetPagination();
      setQueryParams(
        {
          view: value === PlayerSupportViewFilter.All ? null : value,
          pageToken: null,
        },
        { skipHistory: true },
      );
    },
    [resetPagination, setQueryParams],
  );

  const handleCategoryChange = useCallback(
    (value: typeof selectedCategory) => {
      resetPagination();
      setQueryParams(
        {
          category: value === PlayerSupportCategoryFilter.All ? null : value,
          pageToken: null,
        },
        { skipHistory: true },
      );
    },
    [resetPagination, setQueryParams],
  );

  const handleStatusChange = useCallback(
    (status: TicketStatus) => {
      unifiedLoggerClient.logClickEvent({
        eventName: 'playerSupport.tabSwitch',
        parameters: {
          universeId: String(universeId),
          tab: status === TicketStatus.Archived ? 'archived' : 'needsAction',
        },
      });
      resetPagination();
      setQueryParams({ status, pageToken: null });
    },
    [resetPagination, setQueryParams, universeId],
  );

  const handleTabValueChange = useCallback(
    (value: string) => {
      handleStatusChange(
        value === TicketStatus.Archived ? TicketStatus.Archived : TicketStatus.NeedsAction,
      );
    },
    [handleStatusChange],
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      resetPagination();
      setQueryParams({ pageSize: newPageSize, pageToken: null }, { skipHistory: true });
    },
    [resetPagination, setQueryParams],
  );

  const handleTicketClick = useCallback(
    (ticketId: string, ticketCategory?: string) => {
      unifiedLoggerClient.logClickEvent({
        eventName: 'playerSupport.openTicket',
        parameters: {
          universeId: String(universeId),
          ticketId,
          ticketCategory: ticketCategory ?? '',
          status: selectedStatus === TicketStatus.Archived ? 'archived' : 'needsAction',
          isMobile: String(isMobile),
        },
      });
      const pathUniverseId = typeof router.query.id === 'string' ? router.query.id : '';
      void router.push(
        `/dashboard/creations/experiences/${pathUniverseId}/player-support/${ticketId}`,
      );
    },
    [router, universeId, selectedStatus, isMobile],
  );

  const noRequestsFoundTitle = translate('Description.PlayerSupport.NoFilteredSupportRequests');
  const noRequestsFoundDescription = translate(
    'Description.PlayerSupport.NoFilteredSupportRequestsDesc',
  );

  return (
    <>
      {isPending && (
        <div className='justify-center padding-xlarge margin-top-large flex'>
          <ProgressCircle
            variant='Indeterminate'
            size='Medium'
            ariaLabel={translate('Label.AriaLabel.LoadingTickets')}
          />
        </div>
      )}
      {!isPending && isNotFoundError && (
        <div className='items-center padding-xlarge margin-top-large gap-medium flex flex-col'>
          <div className='padding-bottom-large'>
            <div className='relative items-center justify-center size-2500 flex'>
              <div className='absolute opacity-[0.16] size-2500 stroke-standard [border-color:var(--color-content-emphasis)] [border-radius:5px] [transform:rotate(-15deg)]' />
              <Icon name='icon-regular-envelope' className='content-emphasis !size-1800' />
            </div>
          </div>
          <div className='items-center text-align-x-center gap-small flex flex-col'>
            <span className='content-emphasis text-heading-small'>
              {translate('Description.PlayerSupport.NoSupportRequests')}
            </span>
            <span className='content-default text-body-medium'>
              {translate('Description.PlayerSupport.NoSupportRequestsDescription')}
            </span>
          </div>
        </div>
      )}
      {!isPending && !isNotFoundError && (
        <div className='flex flex-col'>
          <div className='width-full [box-shadow:inset_0_calc(-1*var(--stroke-thick))_0_var(--color-stroke-muted)]'>
            <Tabs
              value={selectedStatus}
              onValueChange={handleTabValueChange}
              variant='Inlined'
              fitBehavior='Fit'>
              <TabsList>
                <TabsTrigger
                  value={TicketStatus.NeedsAction}
                  className='width-[137px] !padding-y-none'>
                  {translate('Label.TicketFilter.SupportRequests')}
                </TabsTrigger>
                <TabsTrigger
                  value={TicketStatus.Archived}
                  className='width-[137px] !padding-y-none'>
                  {translate('Label.TicketFilter.ArchivedRequests')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {isSearchAndFiltersEnabled && (
            <PlayerSupportSearchFilters
              search={search}
              view={selectedView}
              category={selectedCategory}
              onSearchChange={handleSearchChange}
              onViewChange={handleViewChange}
              onCategoryChange={handleCategoryChange}
            />
          )}
          {isPlaceholderData && (
            <div className='justify-center padding-xlarge margin-top-large flex'>
              <ProgressCircle
                variant='Indeterminate'
                size='Medium'
                ariaLabel={translate('Label.AriaLabel.LoadingTickets')}
              />
            </div>
          )}
          {!isPlaceholderData && error && (
            <LoadError
              onReload={() => {
                void refetch();
              }}
            />
          )}
          {!isPlaceholderData && !error && tickets.length > 0 ? (
            <>
              {isMobile ? (
                <div className='margin-top-medium gap-[var(--size-1000)] flex flex-col'>
                  {tickets.map((ticket: CreatorTicketSummary, index: number) => (
                    <MobileTicketCard
                      key={ticket.creatorTicketId ?? `ticket-${index}`}
                      ticket={ticket}
                      universeId={universeId}
                      locale={locale}
                      onClick={handleTicketClick}
                    />
                  ))}
                </div>
              ) : (
                <div className='stroke-default margin-top-medium stroke-thin radius-large clip'>
                  <table className='width-full ![border-collapse:collapse]'>
                    <thead>
                      <tr className='height-1200 [border-bottom:var(--stroke-thin)_solid_var(--color-stroke-default)]'>
                        <th className='content-emphasis text-label-medium text-align-x-left width-[50%] padding-x-medium'>
                          <span className='items-center gap-small flex'>
                            <span className='size-200 shrink-0' />
                            {translate('Title.Table.Details')}
                          </span>
                        </th>
                        <th className='content-emphasis text-label-medium text-no-wrap text-align-x-left width-[176px] padding-x-medium'>
                          {translate('Title.Table.Type')}
                        </th>
                        <th className='content-emphasis text-label-medium text-no-wrap text-align-x-left width-[176px] padding-x-medium'>
                          {translate('Title.Table.Created')}
                        </th>
                        {/* Actions column header is intentionally empty; each cell holds an icon-button menu with its own aria-label. */}
                        <th className='width-[1%] padding-x-medium' aria-hidden='true' />
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket: CreatorTicketSummary, index: number) => (
                        <TicketRow
                          key={ticket.creatorTicketId ?? `ticket-${index}`}
                          ticket={ticket}
                          universeId={universeId}
                          locale={locale}
                          onClick={handleTicketClick}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <GenericTablePagination
                page={prevTokens.length}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                setPageSize={handlePageSizeChange}
                onNextPage={handleNextPage}
                onPreviousPage={handlePrevPage}
                hasNext={hasNextPage}
                hasPrevious={prevTokens.length > 0}
              />
            </>
          ) : null}
          {!isPlaceholderData && !error && tickets.length === 0 && (
            <div className='items-center padding-xlarge margin-top-large gap-medium flex flex-col'>
              <div className='padding-bottom-large'>
                <div className='relative items-center justify-center size-2500 flex'>
                  <div
                    className='absolute size-2500 stroke-standard'
                    style={{
                      transform: 'rotate(-15deg)',
                      borderStyle: 'solid',
                      borderColor: 'var(--color-content-emphasis)',
                      borderRadius: 5,
                      opacity: 0.16,
                    }}
                  />
                  <Icon name='icon-regular-envelope' className='content-emphasis !size-1800' />
                </div>
              </div>
              <div className='items-center text-align-x-center gap-xsmall flex flex-col'>
                <span className='content-emphasis text-heading-small'>
                  {hasActiveFilters
                    ? noRequestsFoundTitle
                    : translate(
                        selectedStatus === TicketStatus.Archived
                          ? 'Description.PlayerSupport.NoArchivedSupportRequests'
                          : 'Description.PlayerSupport.NoNeedsActionSupportRequests',
                      )}
                </span>
                <span className='content-default text-body-medium'>
                  {hasActiveFilters
                    ? noRequestsFoundDescription
                    : translate(
                        selectedStatus === TicketStatus.Archived
                          ? 'Description.PlayerSupport.NoArchivedSupportRequestsDesc'
                          : 'Description.PlayerSupport.NoNeedsActionSupportRequestsDesc',
                      )}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default withTranslation(PlayerSupportPage, [TranslationNamespace.PlayerFeedback]);
