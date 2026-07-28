import type { FunctionComponent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Badge, IconButton, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Card, TableCell, TableRow, Typography } from '@rbx/ui';
import type { GameServerLog } from '../../../types/GameServerLog';

export interface ServerLogRowProps {
  log: GameServerLog;
}

const TIMESTAMP_COLUMN_WIDTH = 150;
const COLLAPSED_MESSAGE_LINES = 2.5;
const MESSAGE_LINE_HEIGHT = 1.4;
const COLLAPSED_MESSAGE_MAX_HEIGHT = `calc(${COLLAPSED_MESSAGE_LINES} * ${MESSAGE_LINE_HEIGHT}em)`;
const COLLAPSED_MESSAGE_FADE = `linear-gradient(to bottom, black 0%, black 60%, transparent 100%)`;

const ServerLogRow: FunctionComponent<ServerLogRowProps> = ({ log }) => {
  const { translateWithNamespace } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const hasExtraData =
    !!log.stackTrace || !!log.messageTemplate || (!!log.context && log.context !== '{}');

  const measureMessageOverflow = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setIsOverflowing(node.scrollHeight > node.clientHeight);
    }
  }, []);

  const severityBadge = useMemo(() => {
    switch (log.severity) {
      case 'LogSeverity.Output':
        return (
          <Badge
            label={translateWithNamespace(
              'CreatorDashboard.ServerManagement',
              'ServerDetailsPage.Logs.Severity.Output',
            )}
            variant='Neutral'
          />
        );
      case 'LogSeverity.Info':
        return (
          <Badge
            label={translateWithNamespace(
              'CreatorDashboard.ServerManagement',
              'ServerDetailsPage.Logs.Severity.Info',
            )}
            variant='Neutral'
          />
        );
      case 'LogSeverity.Warning':
        return (
          <Badge
            label={translateWithNamespace(
              'CreatorDashboard.ServerManagement',
              'ServerDetailsPage.Logs.Severity.Warning',
            )}
            variant='Warning'
          />
        );
      case 'LogSeverity.Error':
        return (
          <Badge
            label={translateWithNamespace(
              'CreatorDashboard.ServerManagement',
              'ServerDetailsPage.Logs.Severity.Error',
            )}
            variant='Alert'
          />
        );
      case '':
        return null;
      default:
        return null;
    }
  }, [log.severity, translateWithNamespace]);

  const cellStyle = isExpanded && hasExtraData ? { borderBottom: 'none' } : undefined;
  const showMask = !isExpanded && isOverflowing;

  return (
    <>
      {!!log.rateLimitedCount && log.rateLimitedCount > 0 && (
        <TableRow selected>
          <TableCell colSpan={4} className='text-align-x-center padding-xlarge'>
            {log.rateLimitedCount === 1
              ? translateWithNamespace(
                  'CreatorDashboard.ServerManagement',
                  'ServerDetailsPage.Logs.RateLimitReachedSingular',
                  {
                    count: log.rateLimitedCount.toString(),
                  },
                )
              : translateWithNamespace(
                  'CreatorDashboard.ServerManagement',
                  'ServerDetailsPage.Logs.RateLimitReachedPlural',
                  {
                    count: log.rateLimitedCount.toString(),
                  },
                )}
          </TableCell>
        </TableRow>
      )}
      <TableRow>
        <TableCell
          style={{
            minWidth: TIMESTAMP_COLUMN_WIDTH,
            maxWidth: TIMESTAMP_COLUMN_WIDTH,
            ...cellStyle,
          }}>
          <div className='flex wrap gap-x-xsmall'>
            <span className='text-no-wrap'>
              {log.messageTimestampMs.toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC',
              })}
              ,
            </span>
            <span className='text-no-wrap'>
              {log.messageTimestampMs.toLocaleString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                fractionalSecondDigits: 3,
                timeZone: 'UTC',
              })}
            </span>
          </div>
        </TableCell>
        <TableCell style={cellStyle}>{severityBadge}</TableCell>
        <TableCell className='width-full' style={cellStyle}>
          <div
            ref={measureMessageOverflow}
            className={`flex gap-small ${isExpanded ? 'items-center' : 'items-start'}`}
            style={{
              maxHeight: isExpanded ? undefined : COLLAPSED_MESSAGE_MAX_HEIGHT,
              maskImage: showMask ? COLLAPSED_MESSAGE_FADE : undefined,
              WebkitMaskImage: showMask ? COLLAPSED_MESSAGE_FADE : undefined,
            }}>
            <span
              className='min-width-0'
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
              {log.message}
            </span>
            {!!log.skippedCount && log.skippedCount > 0 && (
              <Tooltip
                title={
                  log.skippedCount === 1
                    ? translateWithNamespace(
                        'CreatorDashboard.ServerManagement',
                        'ServerDetailsPage.Logs.SkippedCountTooltipSingular',
                        {
                          count: log.skippedCount.toString(),
                        },
                      )
                    : translateWithNamespace(
                        'CreatorDashboard.ServerManagement',
                        'ServerDetailsPage.Logs.SkippedCountTooltipPlural',
                        {
                          count: log.skippedCount.toString(),
                        },
                      )
                }
                position='right-center'>
                <TooltipTrigger asChild>
                  <Badge
                    label={translateWithNamespace(
                      'CreatorDashboard.ServerManagement',
                      'ServerDetailsPage.Logs.SkippedCountBadge',
                      {
                        count: log.skippedCount.toString(),
                      },
                    )}
                    className='shrink-0'
                  />
                </TooltipTrigger>
              </Tooltip>
            )}
          </div>
        </TableCell>
        <TableCell style={{ verticalAlign: 'top', ...cellStyle }}>
          {(hasExtraData || isOverflowing) && (
            <IconButton
              icon={isExpanded ? 'icon-filled-chevron-large-up' : 'icon-filled-chevron-large-down'}
              size='Small'
              variant='Utility'
              ariaLabel={translateWithNamespace(
                'CreatorDashboard.ServerManagement',
                'SeverDetailsPage.Log.ExpandDetails',
              )}
              onClick={() => setIsExpanded((prev) => !prev)}
            />
          )}
        </TableCell>
      </TableRow>
      {isExpanded && hasExtraData && (
        <TableRow>
          <TableCell colSpan={4}>
            <div className='flex flex-col gap-small'>
              {!!log.messageTemplate && (
                <>
                  <Typography>
                    {translateWithNamespace(
                      'CreatorDashboard.ServerManagement',
                      'ServerDetailsPage.Logs.Header.MessageTemplate',
                    )}
                  </Typography>
                  <Card variant='outlined' className='padding-large'>
                    <span
                      className="[font-family:'Builder_Mono']"
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                      {log.messageTemplate}
                    </span>
                  </Card>
                </>
              )}
              {!!log.context && log.context !== '{}' && (
                <>
                  <Typography>
                    {translateWithNamespace(
                      'CreatorDashboard.ServerManagement',
                      'ServerDetailsPage.Logs.Header.MessageContext',
                    )}
                  </Typography>
                  <Card variant='outlined' className='padding-large'>
                    <span
                      className="[font-family:'Builder_Mono']"
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                      {log.context}
                    </span>
                  </Card>
                </>
              )}
              {!!log.stackTrace && (
                <>
                  <Typography>
                    {translateWithNamespace(
                      'CreatorDashboard.ServerManagement',
                      'ServerDetailsPage.Logs.Header.StackTrace',
                    )}
                  </Typography>
                  <Card variant='outlined' className='padding-large'>
                    <span
                      className="[font-family:'Builder_Mono']"
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                      {log.stackTrace}
                    </span>
                  </Card>
                </>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default ServerLogRow;
