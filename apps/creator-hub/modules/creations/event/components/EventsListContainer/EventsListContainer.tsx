import { EventStatus, EventVisibility, VirtualEventResponse } from '@rbx/clients/virtualEventsApi';
import {
  Grid,
  IconButton,
  Link,
  NavigateBeforeIcon,
  NavigateNextIcon,
  Table,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  useMediaQuery,
} from '@rbx/ui';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { PageLoading } from '@modules/miscellaneous/common';
import { ErrorPage } from '@modules/miscellaneous/error';
import { virtualEventsClient } from '@modules/clients';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { StatusCodes } from '@rbx/core';
import { EmptyState } from '@modules/miscellaneous/common/components';
import EventListItem from './EventListItem';
import {
  eventPageSize,
  eventCreationsSubtabs,
  ExperienceEventState,
  tableStackViewBreakpoint,
  experienceEventsLearnMoreLink,
} from '../common/constants';
import EventProvider from '../EventProvider';
import CreateEventButton from '../common/CreateEventButton';
import EventsSubmenu from '../common/EventsSubmenu';
import { eventStateToTiming, parseEventState, statusToVisibility } from '../../utils/eventUtils';
import useEventListStyles from './EventList.styles';

const EventsListContainer = () => {
  const submenuTabs = useMemo(
    () => [
      eventCreationsSubtabs.Active,
      eventCreationsSubtabs.Scheduled,
      eventCreationsSubtabs.Finished,
    ],
    [],
  );

  const [eventsList, setEventsList] = useState<VirtualEventResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ExperienceEventState>(
    eventCreationsSubtabs.Active.name,
  );
  const [publicOnly, setPublicOnly] = useState<boolean>(false);
  const [prevPageCursor, setPrevPageCursor] = useState<string | null | undefined>('');
  const [nextPageCursor, setNextPageCursor] = useState<string | null | undefined>('');
  const [errorState, setErrorState] = useState<boolean>(false);

  const { translate, translateHTML } = useTranslation();
  const { gameDetails } = useCurrentGame();
  const [query, setQueryParams] = useQueryParams(['eventState']);
  const isStackView = useMediaQuery((theme) => theme.breakpoints.down(tableStackViewBreakpoint));
  const {
    classes: {
      primaryTableColumn,
      secondaryTableColumn,
      listFooterContainer,
      paginationButtonContainer,
      listHeader,
    },
  } = useEventListStyles();

  useEffect(() => {
    if (!(typeof query.eventState === 'string' && query.eventState in eventCreationsSubtabs)) {
      // If the current event tab is invalid, we redirect to the Active tab
      setQueryParams({
        eventState: eventCreationsSubtabs.Active.name,
      });
      setActiveTab(eventCreationsSubtabs.Active.name);
    } else {
      setActiveTab(parseEventState(query.eventState) || ExperienceEventState.Active);
    }
  }, [query, setQueryParams, submenuTabs]);

  const loadEventList = useCallback(
    async (cursor: string, reverse: boolean) => {
      setIsLoading(true);
      try {
        const timingParameters = eventStateToTiming(activeTab);

        const rawResult = await virtualEventsClient.getUniverseEvents({
          cursor,
          universeId: Number(gameDetails?.id),
          endsBefore: timingParameters.endsBeforeTime,
          endsAfter: timingParameters.endsAfterTime,
          startsBefore: timingParameters.startsBeforeTime,
          startsAfter: timingParameters.startsAfterTime,
          visibility: publicOnly ? EventVisibility.Public : undefined,
          limit: eventPageSize,
          reverse,
        });

        // Convert the status for any events w/o visibility into visibility for downstream logic
        // TODO (@rachel.anderson): After Status is fully deprecated, we can remove this
        const parsedResponse: VirtualEventResponse[] = [];
        rawResult.data?.forEach((event) => {
          const parsedEvent = event;
          if (!parsedEvent.eventVisibility) {
            parsedEvent.eventVisibility = statusToVisibility(
              event.eventStatus ?? EventStatus.Unpublished,
            );
          }
          parsedResponse.push(parsedEvent);
        });

        setEventsList(parsedResponse);
        setNextPageCursor(rawResult.nextPageCursor);
        setPrevPageCursor(rawResult.previousPageCursor);
      } catch {
        setErrorState(true);
      } finally {
        setIsLoading(false);
      }
    },
    [activeTab, gameDetails, publicOnly],
  );

  useEffect(() => {
    loadEventList('', false);
  }, [loadEventList]);

  const onTabChange = useCallback(
    (tab: ExperienceEventState) => {
      if (tab === activeTab) {
        return;
      }
      setQueryParams({
        eventState: tab,
      });
    },
    [activeTab, setQueryParams],
  );

  const removeEvent = useCallback(
    (index: number) => {
      setEventsList(eventsList.toSpliced(index, 1));
    },
    [eventsList],
  );

  const getTimeLabel = useCallback(() => {
    switch (activeTab) {
      case ExperienceEventState.Finished:
        return translate('Label.EEEnded');
      case ExperienceEventState.Scheduled:
        return translate('Label.EEStartTime');
      case ExperienceEventState.Active:
      default:
        return translate('Label.EEEndTime');
    }
  }, [activeTab, translate]);

  const headerComponent = useMemo(
    () => (
      <Grid className={listHeader} marginBottom={isStackView ? '20px' : '0px'}>
        {eventsList.length > 0 && <CreateEventButton color='primaryBrand' />}
        <EventsSubmenu
          isPublicOnly={publicOnly}
          setActiveTab={onTabChange}
          activeTab={activeTab}
          submenuTabs={submenuTabs}
          setIsPublicOnly={setPublicOnly}
        />
      </Grid>
    ),
    [activeTab, eventsList.length, isStackView, listHeader, onTabChange, publicOnly, submenuTabs],
  );

  if (isLoading) {
    return (
      <Fragment>
        {headerComponent}
        <PageLoading />
      </Fragment>
    );
  }

  if (errorState) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  if (eventsList.length === 0) {
    return (
      <Fragment>
        {headerComponent}
        <Grid marginTop='36px'>
          <EmptyState
            title={translate('Label.EmptyStateEvents')}
            description={translateHTML('Description.EmptyStateEvents', [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content(chunks) {
                  return (
                    <Link href={experienceEventsLearnMoreLink} target='_blank'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
            illustration='eventsAndUpdates'>
            <CreateEventButton color='primary' />
          </EmptyState>
        </Grid>
      </Fragment>
    );
  }

  if (isStackView) {
    return (
      <Fragment>
        {headerComponent}
        {eventsList.map((event, index) => (
          <EventProvider key={event.id} eventId={event.id ?? ''}>
            <EventListItem
              key={event.id}
              event={event}
              handleRemove={() => {
                removeEvent(index);
              }}
              showStartTime={activeTab === ExperienceEventState.Scheduled}
              showPublicOnly={publicOnly}
            />
          </EventProvider>
        ))}
        {(nextPageCursor || prevPageCursor) && (
          <Grid display='flex' justifyContent='end'>
            <IconButton
              color='inherit'
              aria-label={translate('Button.Previous')}
              disabled={!prevPageCursor}
              onClick={() => {
                loadEventList(prevPageCursor ?? '', true);
              }}>
              <NavigateBeforeIcon fontSize='large' />
            </IconButton>
            <IconButton
              color='inherit'
              aria-label={translate('Button.Next')}
              disabled={!nextPageCursor}
              onClick={() => {
                loadEventList(nextPageCursor ?? '', false);
              }}>
              <NavigateNextIcon fontSize='large' />
            </IconButton>
          </Grid>
        )}
      </Fragment>
    );
  }

  return (
    <Fragment>
      {headerComponent}
      <TableContainer>
        <Table>
          <colgroup>
            <col className={primaryTableColumn} />
            <col className={secondaryTableColumn} />
            <col className={secondaryTableColumn} />
            <col className={secondaryTableColumn} />
            <col className={secondaryTableColumn} />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell>{translate('Heading.Name')}</TableCell>
              <TableCell>{translate('Label.Privacy')}</TableCell>
              <TableCell>{translate('Label.EECategory')}</TableCell>
              <TableCell>{getTimeLabel()}</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          {eventsList.map((event, index) => (
            <EventProvider key={event.id} eventId={event.id ?? ''}>
              <EventListItem
                key={event.id}
                event={event}
                handleRemove={() => {
                  removeEvent(index);
                }}
                showStartTime={activeTab === ExperienceEventState.Scheduled}
                showPublicOnly={publicOnly}
              />
            </EventProvider>
          ))}
        </Table>
      </TableContainer>
      {(nextPageCursor || prevPageCursor) && (
        <TableFooter className={listFooterContainer}>
          <TableRow className={paginationButtonContainer}>
            <IconButton
              color='inherit'
              aria-label={translate('Button.Previous')}
              disabled={!prevPageCursor}
              onClick={() => {
                loadEventList(prevPageCursor ?? '', true);
              }}>
              <NavigateBeforeIcon fontSize='large' />
            </IconButton>
            <IconButton
              color='inherit'
              aria-label={translate('Button.Next')}
              disabled={!nextPageCursor}
              onClick={() => {
                loadEventList(nextPageCursor ?? '', false);
              }}>
              <NavigateNextIcon fontSize='large' />
            </IconButton>
          </TableRow>
        </TableFooter>
      )}
    </Fragment>
  );
};

export default EventsListContainer;
