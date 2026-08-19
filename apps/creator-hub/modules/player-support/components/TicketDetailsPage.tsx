import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import { useFlag } from '@rbx/flags';
import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Divider,
  Icon,
  ProgressCircle,
  Timeline,
  TimelineItem,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import type { Locale } from '@rbx/intl';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  AssetThumbnailSize,
  ReturnPolicy,
  Thumbnail2d,
  ThumbnailResponseState,
  ThumbnailTypes,
} from '@rbx/thumbnails';
import { Alert, Avatar, useMediaQuery, useSnackbar, type TTheme } from '@rbx/ui';
import { enablePlayerSupportCreatorTicketReroute } from '@generated/flags/creatorGameops';
import useLocale from '@modules/charts-generic/context/useLocale';
import {
  TicketResponse,
  TicketStatus,
  UserResponse,
  type CreatorTicket,
  type GetTicketAsCreatorResponse,
  type UpdateTicketAsCreatorResponse,
} from '@modules/clients/creatorCommunication';
import { getResponseFromError } from '@modules/clients/utils';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import type { InspectorImage } from '@modules/ip/license-manager/agreements/components/ScreenshotInspector';
import ScreenshotInspector from '@modules/ip/license-manager/agreements/components/ScreenshotInspector';
import { toastDurationTime } from '@modules/miscellaneous/common';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { formatDate } from '@modules/miscellaneous/utils/dateUtils';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { getCannedRepliesForCategory } from '../constants/cannedReplies';
import {
  hasTicketCategoryTranslationKey,
  TICKET_CATEGORY_TRANSLATION_KEY,
} from '../constants/ticketLabels';
import { SECONDS_PER_DAY, SECONDS_PER_HOUR, SECONDS_PER_MINUTE } from '../constants/timeConstants';
import useMarkTicketViewedMutation from '../hooks/useMarkTicketViewedMutation';
import useRerouteTicketMutation from '../hooks/useRerouteTicketMutation';
import useSendTicketReplyMutation from '../hooks/useSendTicketReplyMutation';
import useTicketCaptureTimesQuery from '../hooks/useTicketCaptureTimesQuery';
import useTicketCaptureUrlsQuery from '../hooks/useTicketCaptureUrlsQuery';
import useTicketDetailQuery from '../hooks/useTicketDetailQuery';
import useTicketUsernamesQuery, { type UsernameMap } from '../hooks/useTicketUsernamesQuery';
import { getPlayerSupportTicketDetailQueryKey } from '../queryKeys';
import TicketActionsMenu from './TicketActionsMenu';

const TICKET_METADATA_ENTRIES: ReadonlyArray<{
  key: string;
  translationKey: string;
}> = [
  { key: 'platform_type', translationKey: 'Label.TicketMetadata.PlatformType' },
  {
    key: 'request_country_code',
    translationKey: 'Label.TicketMetadata.RequestCountryCode',
  },
  {
    key: 'client_version',
    translationKey: 'Label.TicketMetadata.ClientVersion',
  },
  { key: 'device_type', translationKey: 'Label.TicketMetadata.DeviceType' },
];

function parseAuthorId(author?: string): number | null {
  if (!author) {
    return null;
  }
  const parsed = Number(author);
  return Number.isNaN(parsed) ? null : parsed;
}

const COMMUNITY_POST_METADATA_KEY = 'community_post';
const COMMUNITY_POST_EXPECTED_PARTS = 3;
const SNACKBAR_ANCHOR = { vertical: 'bottom', horizontal: 'center' } as const;

// `community_post` is the underscore-joined `{groupId}_{categoryId}_{postId}`; `c-`/`p-` prefix the short ids and `g` is a community-slug placeholder.
function buildCommunityPostUrl(rawValue?: string): string | null {
  if (!rawValue) {
    return null;
  }
  const parts = rawValue.split('_');
  if (parts.length !== COMMUNITY_POST_EXPECTED_PARTS) {
    return null;
  }
  const [groupId, categoryId, postId] = parts;
  if (!groupId || !categoryId || !postId) {
    return null;
  }
  return `https://www.${process.env.robloxSiteDomain}/communities/${groupId}/g#!/forums/c-${categoryId}/post/p-${postId}`;
}

function isReporterIdentified(ticket: CreatorTicket): boolean {
  return !!ticket.summary?.userId;
}

const UserIcon: React.FunctionComponent<{
  userId: number;
}> = ({ userId }) => {
  const { translate } = useTranslation();
  const alt = translate('Label.AriaLabel.UserAvatar');
  return (
    <Avatar alt={alt} className='min-width-[20px] min-height-[20px] size-[20px] shrink-0'>
      <Thumbnail2d
        targetId={userId}
        type={ThumbnailTypes.avatarHeadshot}
        alt={alt}
        returnPolicy={ReturnPolicy.PlaceHolder}
        includeBackground
      />
    </Avatar>
  );
};

const GameIcon: React.FunctionComponent<{
  universeId: number;
}> = ({ universeId }) => {
  const { translate } = useTranslation();
  const alt = translate('Label.AriaLabel.ExperienceIcon');
  return (
    <Avatar alt={alt} className='min-width-[20px] min-height-[20px] size-[20px] shrink-0'>
      <Thumbnail2d
        targetId={universeId}
        type={ThumbnailTypes.gameIcon}
        alt={alt}
        returnPolicy={ReturnPolicy.PlaceHolder}
        includeBackground
      />
    </Avatar>
  );
};

const CommentIcon: React.FunctionComponent<{
  author?: string;
  universeId?: number;
}> = ({ author, universeId }) => {
  const authorId = parseAuthorId(author);
  if (authorId == null) {
    return <Icon name='icon-regular-circle-person' className='content-muted size-500' />;
  }
  if (universeId != null && authorId === universeId) {
    return <GameIcon universeId={authorId} />;
  }
  return <UserIcon userId={authorId} />;
};

// ── Image Inspector ──────────────────────────────────────

const EMPTY_ASSET_IDS: number[] = [];

const TicketCaptures: React.FunctionComponent<{
  assetIds?: Array<number>;
  inspectorTitle?: string;
  locale: Locale;
}> = ({ assetIds, inspectorTitle, locale }) => {
  const { translate } = useTranslation();
  const [inspectedIndex, setInspectedIndex] = useState<number | null>(null);
  const [captureStatuses, setCaptureStatuses] = useState<
    ReadonlyMap<number, ThumbnailResponseState>
  >(() => new Map());
  const handleCloseInspector = useCallback(() => setInspectedIndex(null), []);
  const handleCaptureStatus = useCallback(
    (assetId: number, status: ThumbnailResponseState) =>
      setCaptureStatuses((previousStatuses) => {
        if (previousStatuses.get(assetId) === status) {
          return previousStatuses;
        }
        const nextStatuses = new Map(previousStatuses);
        nextStatuses.set(assetId, status);
        return nextStatuses;
      }),
    [],
  );

  const { data: captureUrls } = useTicketCaptureUrlsQuery(assetIds ?? EMPTY_ASSET_IDS);
  const { data: captureTimes } = useTicketCaptureTimesQuery(assetIds ?? EMPTY_ASSET_IDS);

  const captureAltText = (index: number) =>
    translate('Label.PlayerSupport.CaptureAlt', { index: String(index + 1) });

  const inspectorImages = useMemo<InspectorImage[]>(
    () =>
      (assetIds ?? [])
        .map((assetId) => ({ assetId, src: captureUrls?.get(assetId) }))
        .filter((entry): entry is { assetId: number; src: string } => Boolean(entry.src))
        .map(({ assetId, src }) => ({ key: String(assetId), assetId, src })),
    [assetIds, captureUrls],
  );

  if (!assetIds?.length) {
    return null;
  }

  return (
    <div className='padding-top-medium gap-small flex flex-col'>
      <span className='content-emphasis text-label-medium'>
        {translate('Label.PlayerSupport.Captures')}
      </span>
      <div className='gap-small flex wrap'>
        {assetIds.map((assetId, index) => {
          const inspectorIndex = inspectorImages.findIndex((image) => image.assetId === assetId);
          const capturedAt = captureTimes?.get(assetId);
          const captureCaption =
            captureStatuses.get(assetId) === ThumbnailResponseState.Error
              ? translate('Label.PlayerSupport.CaptureModerated')
              : capturedAt
                ? formatDate(capturedAt, locale)
                : null;
          return (
            <div key={assetId} className='gap-xxsmall width-3000 flex flex-col'>
              <button
                type='button'
                aria-label={captureAltText(index)}
                disabled={inspectorIndex === -1}
                onClick={() => setInspectedIndex(inspectorIndex)}
                className='shrink-0 radius-medium clip size-3000 padding-none stroke-none [background:transparent] enabled:cursor-pointer'>
                <Thumbnail2d
                  targetId={assetId}
                  type={ThumbnailTypes.assetThumbnail}
                  alt={captureAltText(index)}
                  returnPolicy={ReturnPolicy.PlaceHolder}
                  containerClass='block'
                  // eslint-disable-next-line no-underscore-dangle -- external enum
                  size={AssetThumbnailSize._420x420}
                  onLoadThumbnailStatus={(status: ThumbnailResponseState) =>
                    handleCaptureStatus(assetId, status)
                  }
                />
              </button>
              {captureCaption && (
                <span className='content-muted text-body-small'>{captureCaption}</span>
              )}
            </div>
          );
        })}
      </div>
      {/*
        TODO: https://roblox.atlassian.net/browse/CSGO-2412 + https://roblox.atlassian.net/browse/UIBLOX-5179
        Replace `ScreenshotInspector` with an approved Foundation component.
      */}
      {inspectedIndex !== null && (
        <ScreenshotInspector
          images={inspectorImages}
          title={inspectorTitle ?? ''}
          initialIndex={inspectedIndex}
          onClose={handleCloseInspector}
        />
      )}
    </div>
  );
};

// ── Activity Section (left column) ──────────────────────────────────────

const ActivitySection: React.FunctionComponent<{
  ticket: CreatorTicket;
  locale: Locale;
  usernameMap: UsernameMap;
  ticketId?: string;
  onReplySuccess?: (response: UpdateTicketAsCreatorResponse) => void;
}> = ({ ticket, locale, usernameMap, ticketId, onReplySuccess }) => {
  const { translate } = useTranslation();
  const { summary, comments, assetIds } = ticket;
  const firstComment = comments?.[0];
  const subsequentComments = comments?.slice(1) ?? [];
  const { gameDetails } = useCurrentGame();
  const universeName = gameDetails?.name;

  const categoryKey =
    summary?.category && hasTicketCategoryTranslationKey(summary.category)
      ? TICKET_CATEGORY_TRANSLATION_KEY[summary.category]
      : undefined;
  const categoryLabel = categoryKey ? translate(categoryKey) : (summary?.category ?? '');

  const isArchived = summary?.status === TicketStatus.Archived;

  const lastCreatorComment = useMemo(() => {
    if (!comments?.length || summary?.userId == null) {
      return null;
    }
    for (let i = comments.length - 1; i >= 0; i -= 1) {
      const authorId = parseAuthorId(comments[i].author);
      if (authorId != null && authorId !== summary.userId) {
        return comments[i];
      }
    }
    return null;
  }, [comments, summary?.userId]);

  const isAwaitingPlayerResponse =
    lastCreatorComment?.commentEnum === TicketResponse.RequestMoreDetails ||
    lastCreatorComment?.commentEnum === TicketResponse.RequestUserInformation;
  const categoryActivityTranslationKey = isAwaitingPlayerResponse
    ? 'Label.Activity.CategoryArchivedAwaitingPlayerResponse'
    : 'Label.Activity.CategoryArchived';

  const archivedDate = lastCreatorComment?.createTime ?? summary?.updateTime;

  const resolveAuthor = (author?: string) => {
    if (author === '' || !author) {
      return translate('Label.Author.Anonymous');
    }
    if (summary?.universeId != null && parseAuthorId(author) === summary.universeId) {
      return universeName
        ? translate('Label.Author.UniverseSupportTeam', { universeName })
        : translate('Label.Author.SupportTeam');
    }
    return usernameMap[author] ?? author;
  };

  return (
    <div className='gap-xsmall flex flex-col'>
      <div className='gap-xsmall flex flex-col'>
        <h3 className='content-emphasis text-heading-small margin-none'>
          {translate('Heading.Activity')}
        </h3>
        <span className='content-muted text-label-small'>
          {translate('Label.Activity.OldestToNewest')}
        </span>
      </div>
      <Timeline placement='Start'>
        <TimelineItem
          title={translate('Label.Activity.PlayerSubmitted', { categoryLabel })}
          description={summary?.createTime ? formatDate(summary.createTime, locale) : ''}
          icon='icon-regular-hand-two-arrows-horizontal'
          className='gap-xlarge [&>div:last-child]:padding-bottom-[40px] [&>div:first-child>span:first-child]:grow-0 [&>div:first-child>span:first-child]:height-200'>
          {firstComment && (
            <div className='padding-top-xsmall gap-xsmall flex flex-col'>
              <div className='items-center gap-xsmall flex'>
                <CommentIcon author={firstComment.author} universeId={summary?.universeId} />
                <span className='content-emphasis text-label-medium'>
                  {resolveAuthor(firstComment.author)}
                </span>
              </div>
              <p className='content-default text-body-medium margin-none [overflow-wrap:anywhere]'>
                {firstComment.message ?? ''}
              </p>
            </div>
          )}
          <TicketCaptures assetIds={assetIds} inspectorTitle={universeName} locale={locale} />
        </TimelineItem>
        {subsequentComments.map((comment, index) => {
          const isFromCurrentCreator =
            summary?.universeId != null && parseAuthorId(comment.author) === summary.universeId;
          const isSharedUserId = comment.userCommentEnum === UserResponse.SharedUserId;
          const author = resolveAuthor(comment.author);
          let title: string;
          if (isSharedUserId) {
            title = translate('Label.Activity.SharedUserInfo', { author });
          } else if (isFromCurrentCreator) {
            title = translate('Label.Activity.YouSentMessage');
          } else {
            title = translate('Label.Activity.AuthorSentMessage', { author });
          }
          return (
            <TimelineItem
              key={`${comment.author}-${comment.createTime}-${String(index)}`}
              title={title}
              description={comment.createTime ? formatDate(comment.createTime, locale) : ''}
              icon='icon-regular-speech-bubble-align-center'
              className='gap-xlarge [&>div:last-child]:padding-bottom-[40px] [&>div:first-child>span:first-child]:grow-0 [&>div:first-child>span:first-child]:height-200'>
              <div className='padding-top-xsmall gap-xsmall flex flex-col'>
                <div className='items-center gap-xsmall flex'>
                  <CommentIcon author={comment.author} universeId={summary?.universeId} />
                  <span className='content-emphasis text-label-medium'>
                    {resolveAuthor(comment.author)}
                  </span>
                </div>
                <p className='content-default text-body-medium margin-none [overflow-wrap:anywhere]'>
                  {isSharedUserId && comment.author
                    ? translate('Message.CannedResponse.UserSharedID', {
                        userId: comment.author,
                      })
                    : (comment.message ?? '')}
                </p>
              </div>
            </TimelineItem>
          );
        })}
        {isArchived && (
          <TimelineItem
            title={translate(categoryActivityTranslationKey, { categoryLabel })}
            description={archivedDate ? formatDate(archivedDate, locale) : ''}
            icon='icon-regular-circle-check'
            className='gap-xlarge [&>div:last-child]:padding-bottom-[40px] [&>div:first-child>span:first-child]:grow-0 [&>div:first-child>span:first-child]:height-200'
          />
        )}
        {ticketId && (
          <ReplySelector ticketId={ticketId} ticket={ticket} onSendSuccess={onReplySuccess} />
        )}
      </Timeline>
    </div>
  );
};

// ── Reply Selector (left column) ────────────────────────────────────────

const ReplySelector: React.FunctionComponent<{
  ticketId: string;
  ticket: CreatorTicket;
  onSendSuccess?: (response: UpdateTicketAsCreatorResponse) => void;
}> = ({ ticketId, ticket, onSendSuccess }) => {
  const { translate } = useTranslation();
  const router = useRouter();
  const [selectedReply, setSelectedReply] = useState<TicketResponse | undefined>();
  const [isRerouteConfirmOpen, setIsRerouteConfirmOpen] = useState(false);
  const { enqueue, close } = useSnackbar();
  const { value: isRerouteEnabled } = useFlag(enablePlayerSupportCreatorTicketReroute);

  const universeId = ticket.summary?.universeId;

  const isArchived = ticket.summary?.status === TicketStatus.Archived;
  const isCreatorBlockedFromResponding = useMemo(() => {
    const { comments, summary } = ticket;
    if (!comments?.length || summary?.userId == null || summary.universeId == null) {
      return false;
    }

    const lastComment = comments[comments.length - 1];
    const lastAuthorId = parseAuthorId(lastComment.author);
    if (lastAuthorId == null) {
      return false;
    }

    const isLatestCommentFromUniverse = lastAuthorId === summary.universeId;
    const isLatestResponseReportReceived =
      lastComment.commentEnum === TicketResponse.ReportReceived;

    return isLatestCommentFromUniverse && !isLatestResponseReportReceived;
  }, [ticket]);

  const reporterIdentified = isReporterIdentified(ticket);

  // The "request user information" reply is hidden once the reporter is identified.
  const visibleReplies = useMemo(() => {
    return getCannedRepliesForCategory(ticket.summary?.category).filter(
      (reply) => reply.value !== TicketResponse.RequestUserInformation || !reporterIdentified,
    );
  }, [ticket.summary?.category, reporterIdentified]);

  const showToast = useCallback(
    (severity: 'error' | 'success', message: string) => {
      enqueue({
        children: (
          <Alert variant='standard' severity={severity}>
            {message}
          </Alert>
        ),
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: close,
      });
    },
    [enqueue, close],
  );

  const { mutate: sendReply, isPending: isSending } = useSendTicketReplyMutation({
    ticketId,
    universeId,
    onSuccess: (response) => {
      onSendSuccess?.(response);
      setSelectedReply(undefined);
    },
    onError: () => {
      showToast('error', translate('Message.SendReplyError.Generic'));
    },
  });

  const { mutate: rerouteTicket, isPending: isRerouting } = useRerouteTicketMutation({
    ticketId,
    universeId: universeId ?? 0,
    onSuccess: () => {
      setIsRerouteConfirmOpen(false);
      setSelectedReply(undefined);
      enqueue({
        children: (
          <div className='bg-inverse-surface-0 content-inverse-default radius-medium padding-x-medium padding-y-small text-body-medium'>
            {translate('Message.PlayerSupport.RerouteSuccess')}
          </div>
        ),
        anchorOrigin: SNACKBAR_ANCHOR,
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: close,
        className: 'margin-bottom-large',
      });
      const pathUniverseId = typeof router.query.id === 'string' ? router.query.id : '';
      void router.push(`/dashboard/creations/experiences/${pathUniverseId}/player-support`);
    },
    onError: () => {
      setIsRerouteConfirmOpen(false);
      showToast('error', translate('Message.PlayerSupport.RerouteError'));
    },
  });

  // The final canned reply forwards ("reroutes") the ticket to Roblox Customer
  // Support instead of sending a normal reply. It's flag-gated and guarded by a
  // confirmation dialog because the ticket then leaves the creator's inbox.
  const shouldRerouteOnSend =
    isRerouteEnabled === true &&
    selectedReply === TicketResponse.ReportToCustomerSupport &&
    universeId != null;

  const handleSend = useCallback(() => {
    if (!selectedReply) {
      return;
    }
    if (shouldRerouteOnSend) {
      setIsRerouteConfirmOpen(true);
      return;
    }
    unifiedLoggerClient.logClickEvent({
      eventName: 'playerSupport.sendReply',
      parameters: {
        universeId: String(universeId ?? ''),
        ticketId,
        ticketCategory: ticket.summary?.category ?? '',
        replyType: selectedReply,
      },
    });
    sendReply(selectedReply);
  }, [
    selectedReply,
    shouldRerouteOnSend,
    sendReply,
    universeId,
    ticket.summary?.category,
    ticketId,
  ]);

  const handleConfirmReroute = useCallback(() => {
    unifiedLoggerClient.logClickEvent({
      eventName: 'playerSupport.confirmReroute',
      parameters: {
        universeId: String(universeId ?? ''),
        ticketId,
        ticketCategory: ticket.summary?.category ?? '',
      },
    });
    rerouteTicket();
  }, [rerouteTicket, universeId, ticketId, ticket.summary?.category]);

  const handleCancelReroute = useCallback(() => {
    setIsRerouteConfirmOpen(false);
  }, []);

  if (isArchived || isCreatorBlockedFromResponding || visibleReplies.length === 0) {
    return null;
  }

  return (
    <TimelineItem
      title=''
      icon='icon-regular-speech-bubble-align-center'
      className='gap-xlarge [&>div:first-child>span:first-child]:grow-0 [&>div:first-child>span:first-child]:height-200 [&>div:last-child>div:last-child]:padding-top-none'>
      <div className='gap-medium flex flex-col'>
        <div className='items-center gap-xsmall flex'>
          <span className='content-emphasis text-title-medium'>
            {translate('Label.ReplySelector.SelectReply')}
          </span>
          <Tooltip
            position='top-center'
            delayDurationMs={0}
            title={translate('Action.ReplySelector.Tooltip')}>
            <TooltipTrigger asChild>
              <Icon
                name='icon-regular-circle-question'
                size='Small'
                className='cursor-pointer items-center content-emphasis flex'
              />
            </TooltipTrigger>
          </Tooltip>
        </div>
        <div className='gap-small flex flex-col'>
          {visibleReplies.map((reply) => {
            const isSelected = selectedReply === reply.value;
            // With reroute enabled, the customer-support reply forwards the
            // ticket rather than sending a canned response, so it reads
            // "Forwarded to Customer Support" instead of "Report to...".
            const labelKey =
              isRerouteEnabled === true && reply.value === TicketResponse.ReportToCustomerSupport
                ? 'Message.CannedResponse.ForwardedToCustomerService'
                : reply.labelKey;
            return (
              <button
                key={reply.value}
                type='button'
                aria-pressed={isSelected}
                onClick={() => {
                  if (!isSelected) {
                    unifiedLoggerClient.logClickEvent({
                      eventName: 'playerSupport.selectReply',
                      parameters: {
                        universeId: String(ticket.summary?.universeId ?? ''),
                        ticketId,
                        ticketCategory: ticket.summary?.category ?? '',
                        replyType: reply.value,
                      },
                    });
                  }
                  setSelectedReply(isSelected ? undefined : reply.value);
                }}
                className={`cursor-pointer text-title-medium text-align-x-left padding-small stroke-thick radius-medium ${
                  isSelected
                    ? 'bg-action-subtle content-emphasis [border-color:var(--color-selection-start)]'
                    : 'content-emphasis stroke-default [background:transparent] hover:bg-surface-200'
                }`}>
                {translate(labelKey)}
              </button>
            );
          })}
        </div>
        <div>
          <Button
            variant='Emphasis'
            size='Medium'
            isLoading={isSending || isRerouting}
            isDisabled={!selectedReply || isSending || isRerouting}
            onClick={handleSend}>
            {translate('Action.Send')}
          </Button>
        </div>
        <Dialog
          open={isRerouteConfirmOpen}
          onOpenChange={setIsRerouteConfirmOpen}
          isModal
          size='Medium'
          hasCloseAffordance={false}>
          <DialogContent className='width-full'>
            <DialogBody className='gap-xsmall flex flex-col'>
              <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
                {translate('Description.PlayerSupport.ConfirmRerouteTicket')}
              </DialogTitle>
              <span className='content-default text-body-medium'>
                {translate('Description.PlayerSupport.ConfirmRerouteTicketDesc')}
              </span>
            </DialogBody>
            <DialogFooter className='gap-small flex flex-row'>
              <Button
                variant='Standard'
                size='Medium'
                className='grow-1 basis-0'
                isDisabled={isRerouting}
                onClick={handleCancelReroute}>
                {translate('Action.Cancel')}
              </Button>
              <Button
                variant='Alert'
                size='Medium'
                className='grow-1 basis-0'
                isLoading={isRerouting}
                onClick={handleConfirmReroute}>
                {translate('Action.Continue')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TimelineItem>
  );
};

// ── Details Sidebar (right column) ──────────────────────────────────────

const DetailRow: React.FunctionComponent<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className='items-center justify-between min-height-[56px] gap-medium flex'>
    <span className='content-muted text-body-medium shrink-0'>{label}</span>
    <span className='content-default text-title-medium text-align-x-end min-width-[0px] [overflow-wrap:anywhere]'>
      {children}
    </span>
  </div>
);

const DetailsSidebar: React.FunctionComponent<{
  ticket: CreatorTicket;
  locale: Locale;
  usernameMap: UsernameMap;
}> = ({ ticket, locale, usernameMap }) => {
  const { translate } = useTranslation();
  const { summary, metadata } = ticket;

  const communityPostUrl = useMemo(() => {
    if (!metadata) {
      return null;
    }
    const matchedEntry = Object.entries(metadata).find(
      ([k]) => k.toLowerCase() === COMMUNITY_POST_METADATA_KEY,
    );
    return buildCommunityPostUrl(matchedEntry?.[1]);
  }, [metadata]);

  const categoryKey =
    summary?.category && hasTicketCategoryTranslationKey(summary.category)
      ? TICKET_CATEGORY_TRANSLATION_KEY[summary.category]
      : undefined;
  const categoryLabel = categoryKey ? translate(categoryKey) : (summary?.category ?? '');

  const isArchived = summary?.status === TicketStatus.Archived;

  const reporterUserId = summary?.userId;
  const reporterIdentified = isReporterIdentified(ticket);
  const anonymousLabel = translate('Label.Author.Anonymous');
  const reporterName = useMemo(() => {
    if (!reporterUserId) {
      return anonymousLabel;
    }
    const userId = String(reporterUserId);
    const username = usernameMap[userId];
    if (username) {
      return translate('Label.DetailsSidebar.ReporterNameAndID', {
        username,
        userId,
      });
    }
    return translate('Message.CannedResponse.UserSharedID', { userId });
  }, [reporterUserId, usernameMap, anonymousLabel, translate]);

  // Renders the delta as "Just now", "X min(s) ago", or "X hour(s) ago" when
  // within the past 24 hours; falls back to the absolute medium date otherwise.
  // Mins/hours use Intl.RelativeTimeFormat for locale-correct pluralization.
  const formatRelativeDateTime = (dateString: string | undefined): string => {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    // oxlint-disable-next-line react/react-compiler -- relative time is intentionally computed against the current time at render
    const elapsedMs = Date.now() - date.getTime();
    if (elapsedMs < 0) {
      return formatDate(dateString, locale);
    }
    const elapsedSec = Math.floor(elapsedMs / 1000);
    if (elapsedSec < SECONDS_PER_MINUTE) {
      return translate('Label.RelativeTime.JustNow');
    }
    const rtf = new Intl.RelativeTimeFormat(locale.toString(), {
      numeric: 'auto',
    });
    if (elapsedSec < SECONDS_PER_HOUR) {
      const mins = Math.floor(elapsedSec / SECONDS_PER_MINUTE);
      return rtf.format(-mins, 'minute');
    }
    if (elapsedSec < SECONDS_PER_DAY) {
      const hours = Math.floor(elapsedSec / SECONDS_PER_HOUR);
      return rtf.format(-hours, 'hour');
    }
    return formatDate(dateString, locale);
  };

  const ticketId = summary?.creatorTicketId;
  const universeId = summary?.universeId;

  return (
    <div className='stroke-default stroke-thin radius-large flex flex-col'>
      <div className='items-center justify-between padding-top-xlarge padding-bottom-large padding-x-xlarge flex'>
        <h3 className='content-emphasis text-title-large margin-none'>
          {translate('Heading.Details')}
        </h3>
        {ticketId &&
          universeId != null &&
          !isArchived &&
          summary?.reportedToRoblox !== true &&
          summary?.forwardedToRoblox !== true && (
            <TicketActionsMenu
              universeId={universeId}
              ticketId={ticketId}
              alwaysVisible
              surface='detail'
            />
          )}
      </div>
      <div className='padding-x-xlarge'>
        <Divider variant='Standard' />
      </div>
      <div className='padding-x-xlarge padding-bottom-medium flex flex-col [&>*+*]:[border-top:var(--stroke-thin)_solid_var(--color-stroke-default)]'>
        {summary && (
          <DetailRow label={translate('Label.DetailsSidebar.Reporter')}>
            <span className='items-center justify-end min-width-[0px] gap-xsmall flex'>
              {reporterIdentified ? (
                <UserIcon userId={Number(summary.userId)} />
              ) : (
                <Icon
                  name='icon-regular-circle-person'
                  className='content-muted size-500 shrink-0'
                />
              )}
              <span className='text-no-wrap text-truncate-end min-width-[0px]' title={reporterName}>
                {reporterName}
              </span>
            </span>
          </DetailRow>
        )}
        <DetailRow label={translate('Title.Table.Status')}>
          <Badge
            label={
              isArchived
                ? translate('Label.TicketStatus.Archived')
                : translate('Label.TicketStatus.NeedsAttention')
            }
            variant='Neutral'
            className='!height-800 !padding-x-medium'
          />
        </DetailRow>
        <DetailRow label={translate('Label.PlayerSupport.Filter.Category')}>
          <Badge
            label={categoryLabel}
            variant='Neutral'
            className='!height-800 !padding-x-medium'
          />
        </DetailRow>
        {summary?.createTime && (
          <DetailRow label={translate('Title.Table.Created')}>
            {formatDate(summary.createTime, locale)}
          </DetailRow>
        )}
        {summary?.updateTime && (
          <DetailRow label={translate('Label.DetailsSidebar.LastUpdated')}>
            {formatRelativeDateTime(summary.updateTime)}
          </DetailRow>
        )}
        {metadata &&
          TICKET_METADATA_ENTRIES.map(({ key, translationKey: metadataTranslationKey }) => {
            // Case-insensitive lookup against backend-provided keys so minor
            // casing drift (e.g. `Platform_Type`) still resolves.
            const matchedEntry = Object.entries(metadata).find(([k]) => k.toLowerCase() === key);
            const value = matchedEntry?.[1];
            if (value == null || value === '') {
              return null;
            }
            return (
              <DetailRow key={key} label={translate(metadataTranslationKey)}>
                {value}
              </DetailRow>
            );
          })}
        {communityPostUrl && (
          <DetailRow label={translate('Label.DetailsSidebar.ForumPost')}>
            <a
              href={communityPostUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='content-link text-title-medium no-underline hover:underline'
              onClick={() => {
                unifiedLoggerClient.logClickEvent({
                  eventName: 'playerSupport.viewForumPost',
                  parameters: {
                    universeId: String(universeId ?? ''),
                    ticketId: ticketId ?? '',
                    ticketCategory: summary?.category ?? '',
                  },
                });
              }}>
              {translate('Action.DetailsSidebar.ViewForumPost')}
            </a>
          </DetailRow>
        )}
      </div>
    </div>
  );
};

// ── Main Page ───────────────────────────────────────────────────────────

const TicketDetailsPage: React.FunctionComponent = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const ticketId = typeof router.query.ticketId === 'string' ? router.query.ticketId : undefined;
  const locale = useLocale();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery((theme: TTheme) => theme.breakpoints.down('Medium'));

  const { data, isPending, error, refetch } = useTicketDetailQuery(ticketId);

  const ticket = data?.creatorTicket;
  const { usernameMap } = useTicketUsernamesQuery(ticket);

  const { mutate: markAsViewed } = useMarkTicketViewedMutation();

  const loadedTicketId = ticket?.summary?.creatorTicketId;
  const alreadyViewed = ticket?.summary?.viewedByCreator === true;
  const isArchivedTicket = ticket?.summary?.status === TicketStatus.Archived;
  useEffect(() => {
    if (loadedTicketId && !alreadyViewed && !isArchivedTicket) {
      markAsViewed(loadedTicketId);
    }
  }, [loadedTicketId, alreadyViewed, isArchivedTicket, markAsViewed]);

  const handleMutationSuccess = useCallback(
    (response: UpdateTicketAsCreatorResponse) => {
      if (!ticketId || !response.creatorTicket) {
        return;
      }
      queryClient.setQueryData<GetTicketAsCreatorResponse>(
        getPlayerSupportTicketDetailQueryKey(ticketId),
        { creatorTicket: response.creatorTicket },
      );
      void queryClient.invalidateQueries({
        queryKey: ['playerSupportTickets'],
      });
    },
    [queryClient, ticketId],
  );

  if (isPending) {
    return (
      <div className='justify-center padding-xlarge flex'>
        <ProgressCircle
          variant='Indeterminate'
          size='Medium'
          ariaLabel={translate('Label.AriaLabel.LoadingTickets')}
        />
      </div>
    );
  }

  const isNotFoundError = getResponseFromError(error)?.status === 404;

  if (error && !isNotFoundError) {
    return (
      <LoadError
        onReload={() => {
          void refetch();
        }}
      />
    );
  }

  if (!ticket || isNotFoundError) {
    return (
      <div className='items-center padding-xlarge margin-top-large gap-medium flex flex-col'>
        <Icon name='icon-regular-triangle-exclamation' className='content-emphasis !size-1800' />
        <div className='items-center text-align-x-center gap-xsmall flex flex-col'>
          <span className='content-emphasis text-heading-small'>
            {translate('Heading.PlayerSupport.SomethingWentWrong')}
          </span>
          <span className='content-default text-body-medium'>
            {translate('Description.PlayerSupport.TicketNotFound')}
          </span>
        </div>
      </div>
    );
  }

  const isReportedToRoblox = ticket.summary?.reportedToRoblox === true;
  const isForwardedToRoblox = ticket.summary?.forwardedToRoblox === true;
  if (isReportedToRoblox || isForwardedToRoblox) {
    return (
      <div className='items-center padding-xlarge margin-top-large gap-medium flex flex-col'>
        <Icon name='icon-regular-triangle-exclamation' className='content-emphasis !size-1800' />
        <div className='items-center text-align-x-center gap-xsmall flex flex-col'>
          <span className='content-emphasis text-heading-small'>
            {isForwardedToRoblox
              ? translate('Heading.PlayerSupport.ForwardedRequest')
              : translate('Heading.PlayerSupport.ReportedRequest')}
          </span>
          <span className='content-default text-body-medium'>
            {translate('Description.PlayerSupport.ReportedRequestHidden')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className='width-full max-width-[1200px] margin-x-auto gap-large flex flex-col'>
      <div className={`gap-xlarge flex ${isMobile ? 'items-stretch flex-col' : 'items-start'}`}>
        {/* Activity & Reply (top on mobile, left column on desktop) */}
        <div className='width-full min-width-[0px] gap-xlarge flex flex-col grow-1 shrink-1'>
          <h1 className='content-emphasis text-heading-large margin-none text-no-wrap text-truncate-end'>
            {ticket.summary?.title ?? ''}
          </h1>
          <ActivitySection
            ticket={ticket}
            locale={locale}
            usernameMap={usernameMap}
            ticketId={ticketId}
            onReplySuccess={handleMutationSuccess}
          />
        </div>
        {/* Details sidebar (bottom on mobile, right column on desktop) */}
        <div className={isMobile ? 'width-full' : 'max-width-[600px] min-width-[350px] shrink-0'}>
          <DetailsSidebar ticket={ticket} locale={locale} usernameMap={usernameMap} />
        </div>
      </div>
    </div>
  );
};

// `ScreenshotInspector` is borrowed from agreements-manager and calls bare `translate()` for its own
// keys, so its namespace is registered too. Will be removed when the ScreenshotInspector is replaced.
export default withTranslation(TicketDetailsPage, [
  TranslationNamespace.PlayerFeedback,
  TranslationNamespace.AgreementsManager,
]);
