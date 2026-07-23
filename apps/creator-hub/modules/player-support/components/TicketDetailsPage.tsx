import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
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
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Alert, Avatar, useMediaQuery, useSnackbar, type TTheme } from '@rbx/ui';
import useLocale from '@modules/charts-generic/context/useLocale';
import {
  TicketCategory,
  TicketResponse,
  TicketStatus,
  UserResponse,
  type CreatorTicket,
  type GetTicketAsCreatorResponse,
  type UpdateTicketAsCreatorResponse,
} from '@modules/clients/creatorCommunication';
import { getResponseFromError } from '@modules/clients/utils';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { toastDurationTime } from '@modules/miscellaneous/common';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { formatDate } from '@modules/miscellaneous/utils/dateUtils';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import {
  hasTicketCategoryTranslationKey,
  TICKET_CATEGORY_TRANSLATION_KEY,
} from '../constants/ticketLabels';
import { SECONDS_PER_DAY, SECONDS_PER_HOUR, SECONDS_PER_MINUTE } from '../constants/timeConstants';
import useMarkTicketViewedMutation from '../hooks/useMarkTicketViewedMutation';
import useSendTicketReplyMutation from '../hooks/useSendTicketReplyMutation';
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

const CANNED_REPLIES = [
  {
    value: TicketResponse.ReportReceived,
    labelKey: 'Message.CannedResponse.ReportReceived',
  },
  {
    value: TicketResponse.IssueFixed,
    labelKey: 'Message.CannedResponse.IssueFixed',
  },
  {
    value: TicketResponse.AwareNoActionTaken,
    labelKey: 'Message.CannedResponse.AwareNoActionTaken',
  },
  {
    value: TicketResponse.RequestMoreDetails,
    labelKey: 'Message.CannedResponse.RequestMoreDetails',
  },
  {
    value: TicketResponse.ReportToCustomerService,
    labelKey: 'Message.CannedResponse.ReportToCustomerService',
  },
  {
    value: TicketResponse.RequestUserInformation,
    labelKey: 'Message.CannedResponse.RequestUserInformation',
  },
  {
    value: TicketResponse.MissingItemsAdded,
    labelKey: 'Message.CannedResponse.MissingItemsAdded',
  },
  {
    value: TicketResponse.DataRestored,
    labelKey: 'Message.CannedResponse.DataRestored',
  },
  {
    value: TicketResponse.UnableToRestoreData,
    labelKey: 'Message.CannedResponse.UnableToRestoreData',
  },
  {
    value: TicketResponse.UnableToTakeActionOnPurchase,
    labelKey: 'Message.CannedResponse.UnableToTakeActionOnPurchase',
  },
] as const;

const REPLIES_BY_CATEGORY: Record<TicketCategory, readonly TicketResponse[]> = {
  [TicketCategory.BugReport]: [
    TicketResponse.IssueFixed,
    TicketResponse.RequestUserInformation,
    TicketResponse.AwareNoActionTaken,
    TicketResponse.RequestMoreDetails,
    TicketResponse.ReportToCustomerService,
  ],
  [TicketCategory.DataRestoreRequest]: [
    TicketResponse.UnableToRestoreData,
    TicketResponse.RequestMoreDetails,
    TicketResponse.DataRestored,
    TicketResponse.ReportToCustomerService,
  ],
  [TicketCategory.PurchasingIssue]: [
    TicketResponse.MissingItemsAdded,
    TicketResponse.UnableToTakeActionOnPurchase,
    TicketResponse.RequestMoreDetails,
    TicketResponse.ReportToCustomerService,
  ],
  [TicketCategory.Other]: [
    TicketResponse.RequestMoreDetails,
    TicketResponse.ReportToCustomerService,
  ],
  [TicketCategory.Invalid]: [],
};

const CANNED_REPLIES_BY_VALUE: ReadonlyMap<TicketResponse, (typeof CANNED_REPLIES)[number]> =
  new Map(CANNED_REPLIES.map((r) => [r.value, r]));

const FALLBACK_CATEGORY: TicketCategory = TicketCategory.Other;

function parseAuthorId(author?: string): number | null {
  if (!author) {
    return null;
  }
  const parsed = Number(author);
  return Number.isNaN(parsed) ? null : parsed;
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

// ── Activity Section (left column) ──────────────────────────────────────

const ActivitySection: React.FunctionComponent<{
  ticket: CreatorTicket;
  locale: Locale;
  usernameMap: UsernameMap;
  ticketId?: string;
  onReplySuccess?: (response: UpdateTicketAsCreatorResponse) => void;
}> = ({ ticket, locale, usernameMap, ticketId, onReplySuccess }) => {
  const { translate } = useTranslation();
  const { summary, comments } = ticket;
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
              <p className='content-default text-body-medium margin-none'>
                {firstComment.message ?? ''}
              </p>
            </div>
          )}
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
                <p className='content-default text-body-medium margin-none'>
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
  const [selectedReply, setSelectedReply] = useState<TicketResponse | undefined>();
  const { enqueue, close } = useSnackbar();

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

  // Filter the canned replies to those allowed for this ticket's category,
  // preserving the per-category order from REPLIES_BY_CATEGORY. Unknown or
  // missing categories fall back to FALLBACK_CATEGORY's set. The
  // "request user information" reply is hidden once the reporter is identified.
  const visibleReplies = useMemo(() => {
    const rawCategory = ticket.summary?.category;
    const category =
      rawCategory && rawCategory in REPLIES_BY_CATEGORY ? rawCategory : FALLBACK_CATEGORY;
    const allowed = REPLIES_BY_CATEGORY[category];
    return allowed.flatMap((value) => {
      if (value === TicketResponse.RequestUserInformation && reporterIdentified) {
        return [];
      }
      const reply = CANNED_REPLIES_BY_VALUE.get(value);
      return reply ? [reply] : [];
    });
  }, [ticket.summary?.category, reporterIdentified]);

  const showErrorToast = useCallback(
    (message: string) => {
      enqueue({
        children: (
          <Alert variant='standard' severity='error'>
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
    universeId: ticket.summary?.universeId,
    onSuccess: (response) => {
      onSendSuccess?.(response);
      setSelectedReply(undefined);
    },
    onError: () => {
      showErrorToast(translate('Message.SendReplyError.Generic'));
    },
  });

  const handleSend = useCallback(() => {
    if (selectedReply) {
      unifiedLoggerClient.logClickEvent({
        eventName: 'playerSupport.sendReply',
        parameters: {
          universeId: String(ticket.summary?.universeId ?? ''),
          ticketId,
          ticketCategory: ticket.summary?.category ?? '',
          replyType: selectedReply,
        },
      });
      sendReply(selectedReply);
    }
  }, [selectedReply, sendReply, ticket.summary?.universeId, ticket.summary?.category, ticketId]);

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
                {translate(reply.labelKey)}
              </button>
            );
          })}
        </div>
        <div>
          <Button
            variant='Emphasis'
            size='Medium'
            isLoading={isSending}
            isDisabled={!selectedReply || isSending}
            onClick={handleSend}>
            {translate('Action.Send')}
          </Button>
        </div>
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
        {ticketId && universeId != null && !isArchived && summary?.reportedToRoblox !== true && (
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
        <DetailRow label={translate('Title.Table.Type')}>
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
          TICKET_METADATA_ENTRIES.map(({ key, translationKey }) => {
            // Case-insensitive lookup against backend-provided keys so minor
            // casing drift (e.g. `Platform_Type`) still resolves.
            const matchedEntry = Object.entries(metadata).find(([k]) => k.toLowerCase() === key);
            const value = matchedEntry?.[1];
            if (value == null || value === '') {
              return null;
            }
            return (
              <DetailRow key={key} label={translate(translationKey)}>
                {value}
              </DetailRow>
            );
          })}
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

  if (ticket.summary?.reportedToRoblox === true) {
    return (
      <div className='items-center padding-xlarge margin-top-large gap-medium flex flex-col'>
        <Icon name='icon-regular-triangle-exclamation' className='content-emphasis !size-1800' />
        <div className='items-center text-align-x-center gap-xsmall flex flex-col'>
          <span className='content-emphasis text-heading-small'>
            {translate('Heading.PlayerSupport.ReportedRequest')}
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

export default withTranslation(TicketDetailsPage, [TranslationNamespace.PlayerFeedback]);
