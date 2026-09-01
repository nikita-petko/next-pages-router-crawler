import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { VirtualEventResponse } from '@rbx/client-virtual-events-api/v1';
import { EventVisibility } from '@rbx/client-virtual-events-api/v1';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { ReturnPolicy, ThumbnailClient, ThumbnailTypes } from '@rbx/thumbnails';
import {
  BrokenImageOutlinedIcon,
  Button,
  EditOutlinedIcon,
  FileCopyOutlinedIcon,
  Grid,
  IconButton,
  MoreVertIcon,
  Skeleton,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useSnackbar,
} from '@rbx/ui';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import useCurrentEvent from '../../hooks/useCurrentEvent';
import { categoryToTranslationKey, visibilityToTranslationKey } from '../../utils/eventStringUtils';
import {
  getEventCategory,
  getEventThumbnailId,
  toLocalizedTimeString,
} from '../../utils/eventUtils';
import { tableStackViewBreakpoint } from '../common/constants';
import useEventListStyles from './EventList.styles';
import EventListContextMenu from './EventListContextMenu';

const enum ThumbnailState {
  Loading,
  Loaded,
  Error,
}

export interface EventListItemProps {
  event: VirtualEventResponse;
  handleRemove: () => void;
  showStartTime: boolean;
}

const EventListItem: FunctionComponent<EventListItemProps> = ({
  event,
  handleRemove,
  showStartTime,
}) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuAnchor, setContextMenuAnchor] = useState<HTMLButtonElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<ThumbnailState>(
    thumbnailUrl ? ThumbnailState.Loaded : ThumbnailState.Loading,
  );
  const { getThumbnailImage } = ThumbnailClient;
  const {
    classes: {
      thumbnailContainer,
      mobileThumbnail,
      mobileDetailsRow,
      nameContainer,
      mobileNameContainer,
      buttonContainer,
      listItemContainer,
      metadataColumn,
    },
  } = useEventListStyles();
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const [hovered, setHovered] = useState(false);
  const thumbnailId = getEventThumbnailId(event.thumbnails);
  const eventId = event.id ?? '';
  const universeId = event.universeId ?? '';
  const title = event.title ?? '';
  const category = getEventCategory(event.eventCategories);
  const displayedTime = showStartTime ? event.eventTime?.startUtc : event.eventTime?.endUtc;
  const timeString = useMemo(
    () => toLocalizedTimeString(displayedTime, locale ?? Locale.English),
    [displayedTime, locale],
  );

  const { gameDetails } = useCurrentGame();
  const { eventDetails } = useCurrentEvent();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const isStackView = useMediaQuery((theme) => theme.breakpoints.down(tableStackViewBreakpoint));
  const isCompact = useMediaQuery((theme) => theme.breakpoints.down('XLarge'));
  const isMobileSizing = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  useEffect(() => {
    const targetId = thumbnailId ?? gameDetails?.rootPlaceId;
    if (!targetId) {
      return undefined;
    }
    let cancelled = false;
    getThumbnailImage(ThumbnailTypes.assetThumbnail, targetId, ReturnPolicy.PlaceHolder)
      .then((data) => {
        if (!cancelled) {
          setThumbnailUrl(data.imageUrl);
          setState(ThumbnailState.Loaded);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState(ThumbnailState.Error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [gameDetails, getThumbnailImage, thumbnailId]);

  const showBottomMsg = useCallback(
    (msg: string) => {
      enqueue({
        message: <span data-testid='success-message'>{msg}</span>,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar],
  );

  const copyEventId = useCallback(() => {
    void navigator.clipboard.writeText(eventId ?? '');
    showBottomMsg(translate('Message.Copied'));
  }, [eventId, showBottomMsg, translate]);

  const thumbnail = useMemo(() => {
    switch (state) {
      case ThumbnailState.Loaded:
        return (
          <img
            className={isStackView ? mobileThumbnail : thumbnailContainer}
            src={thumbnailUrl}
            alt={`${event.title}`}
          />
        );
      case ThumbnailState.Loading:
        return <Skeleton animate variant='rectangular' className={thumbnailContainer} />;
      case ThumbnailState.Error:
        return (
          <Grid
            item
            height='56px'
            width='80px'
            display='flex'
            alignItems='center'
            justifyContent='center'>
            <BrokenImageOutlinedIcon />
          </Grid>
        );
    }
    return null;
  }, [event.title, isStackView, mobileThumbnail, state, thumbnailContainer, thumbnailUrl]);

  const moreButton = useMemo(
    () => (
      <IconButton
        color='default'
        ref={(el: HTMLButtonElement | null) => {
          buttonRef.current = el;
          setContextMenuAnchor(el);
        }}
        aria-label={translate('Tooltip.More')}
        onClick={() => setContextMenuOpen(true)}>
        <MoreVertIcon />
      </IconButton>
    ),
    [translate, setContextMenuOpen],
  );

  if (isStackView) {
    return (
      <Grid display='flex' width='100%' direction='column'>
        <Grid display='flex' direction='row' width='100%' className={mobileNameContainer}>
          {thumbnail}
          <Typography flexGrow='1' textOverflow='ellipsis' noWrap>
            {title}
          </Typography>
          {moreButton}
        </Grid>
        <Grid padding='8px'>
          <Grid className={mobileDetailsRow}>
            <Typography>{translate('Label.Privacy')}</Typography>
            <Typography
              noWrap
              color={
                eventDetails?.eventVisibility === EventVisibility.Public ? 'success' : 'secondary'
              }>
              {eventDetails?.eventVisibility
                ? translate(visibilityToTranslationKey(eventDetails?.eventVisibility))
                : '-'}
            </Typography>
          </Grid>
          <Grid className={mobileDetailsRow}>
            <Typography>{translate('Label.EECategory')}</Typography>
            <Typography noWrap>
              {category ? translate(categoryToTranslationKey(category)) : '-'}
            </Typography>
          </Grid>
          <Grid className={mobileDetailsRow}>
            <Typography>
              {showStartTime ? translate('Label.EEStartTime') : translate('Label.EEEndTime')}
            </Typography>
            <Typography noWrap>{timeString}</Typography>
          </Grid>
        </Grid>
        <EventListContextMenu
          menuOpen={contextMenuOpen}
          anchorEl={isMobileSizing ? null : contextMenuAnchor}
          handleClose={() => setContextMenuOpen(false)}
          handleRemove={handleRemove}
        />
      </Grid>
    );
  }

  return (
    <TableRow
      className={listItemContainer}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <TableCell>
        <Grid className={nameContainer}>
          {thumbnail}
          <Typography>{title}</Typography>
        </Grid>
      </TableCell>
      <TableCell className={metadataColumn}>
        <Typography
          noWrap
          color={eventDetails?.eventVisibility === EventVisibility.Public ? 'success' : 'disabled'}>
          {eventDetails?.eventVisibility
            ? translate(visibilityToTranslationKey(eventDetails?.eventVisibility))
            : '-'}
        </Typography>
      </TableCell>
      <TableCell className={metadataColumn}>
        <Typography noWrap>
          {category ? translate(categoryToTranslationKey(category)) : '-'}
        </Typography>
      </TableCell>
      <TableCell className={metadataColumn}>
        <Typography noWrap>{timeString}</Typography>
      </TableCell>
      <TableCell>
        <Grid className={buttonContainer}>
          {!isCompact && (
            <>
              <Tooltip arrow placement='top' title={translate('Tooltip.EECopyEventID')}>
                <Button
                  style={hovered ? {} : { visibility: 'hidden' }}
                  variant='contained'
                  startIcon={<FileCopyOutlinedIcon />}
                  color='secondary'
                  onClick={copyEventId}>
                  <Typography noWrap>{translate('Action.CopyEventID')}</Typography>
                </Button>
              </Tooltip>
              <Link
                style={hovered ? {} : { visibility: 'hidden' }}
                href={`/dashboard/creations/experiences/${universeId}/events/${eventId}/configure`}>
                <Tooltip arrow placement='top' title={translate('Heading.EEEditEventOrUpdate')}>
                  <IconButton color='default' aria-label={translate('Heading.EEEditEventOrUpdate')}>
                    <EditOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </Link>
            </>
          )}
          <Tooltip arrow placement='top' title={translate('Tooltip.More')}>
            {moreButton}
          </Tooltip>
          <EventListContextMenu
            menuOpen={contextMenuOpen}
            anchorEl={contextMenuAnchor}
            handleClose={() => setContextMenuOpen(false)}
            handleRemove={handleRemove}
          />
        </Grid>
      </TableCell>
    </TableRow>
  );
};

export default EventListItem;
