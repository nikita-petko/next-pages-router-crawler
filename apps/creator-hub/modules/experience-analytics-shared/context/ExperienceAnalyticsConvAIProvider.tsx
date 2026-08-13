import type { FC, PropsWithChildren } from 'react';
import { useCallback, useMemo } from 'react';
import * as signalR from '@microsoft/signalr';
import type { ConversationState } from '@rbx/conv-ai-provider';
import { ConversationLogEvent, ConversationReducerProvider } from '@rbx/conv-ai-provider';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import useQueryParams, {
  normalizeSingleQueryParam,
} from '@modules/miscellaneous/hooks/useQueryParams';
import { useUniverseResource } from '../hooks/useChartResourceProvider';

const signalRConnectionUrl =
  process.env.targetEnvironment === 'production'
    ? 'https://realtime-signalr.roblox.com/userhub'
    : 'https://snc2-realtime-signalr.sitetest1.robloxlabs.com/userhub';

const signalRLogLevel =
  process.env.targetEnvironment === 'production'
    ? signalR.LogLevel.Warning
    : signalR.LogLevel.Trace;

const conversationNamespace = 'Analytics';
const insightQueryKeys = [AnalyticsQueryParams.InsightId] as const;

const getAnalyticsAssistantEventName = (eventName: ConversationLogEvent): string =>
  `AnalyticsAssistant_${eventName}`;

const stringifyLogParam = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    typeof value === 'symbol'
  ) {
    return value.toString();
  }
  // Objects, arrays and functions have no useful primitive form. JSON.stringify
  // returns undefined for a function — deliberately dropping its source text,
  // which was never useful telemetry — and throws on circular values, which a
  // log call must not be able to do.
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return '[unserializable]';
  }
};

export const convertToRecordString = (params?: Record<string, unknown>): Record<string, string> => {
  if (!params) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, stringifyLogParam(value)]),
  );
};

const useGetAnalyticsAssistantLogger = (universeId: number, insightId?: string) => {
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const logConversationEvent = useCallback(
    (
      eventName: ConversationLogEvent,
      state: ConversationState,
      extraParams?: Record<string, unknown>,
    ) => {
      if (!insightId) {
        return;
      }

      const analyticsEventName = getAnalyticsAssistantEventName(eventName);
      switch (eventName) {
        case ConversationLogEvent.BotFinishStreamingResponse:
        case ConversationLogEvent.BotErrorStreamingResponse:
        case ConversationLogEvent.ConnectionReconnecting:
        case ConversationLogEvent.ConnectionReconnected:
        case ConversationLogEvent.ConnectionClosed:
        case ConversationLogEvent.BotStartStreamingResponse:
          unifiedLogger.logImpressionEvent({
            eventName: analyticsEventName,
            parameters: {
              universeId: universeId.toString(),
              insightId,
              messageId: state.activeRequestId ?? '',
              conversationId: state.conversationId ?? '',
              ...convertToRecordString(extraParams),
            },
          });
          break;
        case ConversationLogEvent.UserSubmitPrompt:
        case ConversationLogEvent.UserSubmitRegenerationPrompt:
        case ConversationLogEvent.UserClickStop:
        case ConversationLogEvent.UserRateResponse:
        case ConversationLogEvent.UserStartsRegenerateMessage:
        case ConversationLogEvent.UserSubmitPromptResponseError:
          unifiedLogger.logClickEvent({
            eventName: analyticsEventName,
            parameters: {
              universeId: universeId.toString(),
              insightId,
              messageId: state.activeRequestId ?? '',
              conversationId: state.conversationId ?? '',
              ...convertToRecordString(extraParams),
            },
          });
          break;
        default: {
          const exhaustiveCheck: never = eventName;
          throw new Error(`Unhandled conversation log event: ${String(exhaustiveCheck)}`);
        }
      }
    },
    [insightId, unifiedLogger, universeId],
  );

  return logConversationEvent;
};

const ExperienceAnalyticsConvAIProvider: FC<PropsWithChildren> = ({ children }) => {
  const { id: universeId } = useUniverseResource();
  const [queryParams] = useQueryParams(insightQueryKeys);
  const insightId = normalizeSingleQueryParam(queryParams[AnalyticsQueryParams.InsightId]);

  const assistantOptIn = useMemo(() => {
    return {
      accepted: true,
      process: (callback: () => void) => callback(),
    };
  }, []);
  const logConversationEvent = useGetAnalyticsAssistantLogger(universeId, insightId);

  const conversationProviderProps = useMemo(
    () => ({
      convAiConfig: {
        assistantOptIn,
        conversationNamespace,
        logConversationEvent,
      },
      signalRConfig: {
        signalRConnectionUrl,
        signalRLogLevel,
      },
    }),
    [logConversationEvent, assistantOptIn],
  );

  return (
    <ConversationReducerProvider {...conversationProviderProps}>
      {children}
    </ConversationReducerProvider>
  );
};
export default ExperienceAnalyticsConvAIProvider;
