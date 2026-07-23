import React, { FC, PropsWithChildren, useCallback, useMemo } from 'react';
import { AnalyticsQueryParams } from '@modules/charts-generic';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import {
  ConversationLogEvent,
  ConversationReducerProvider,
  ConversationState,
} from '@rbx/conv-ai-provider';
import * as signalR from '@microsoft/signalr';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
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

const getAnalyticsAssistantEventName = (eventName: ConversationLogEvent): string =>
  `AnalyticsAssistant_${eventName}`;

const convertToRecordString = (params?: Record<string, unknown>): Record<string, string> => {
  if (!params) return {};

  return Object.entries(params).reduce(
    (acc, [key, value]) => {
      if (value === null || value === undefined) {
        acc[key] = '';
      } else if (typeof value === 'object') {
        acc[key] = JSON.stringify(value);
      } else {
        acc[key] = String(value);
      }
      return acc;
    },
    {} as Record<string, string>,
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
      if (!insightId) return;

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
          throw new Error(`Unhandled conversation log event: ${exhaustiveCheck}`);
        }
      }
    },
    [insightId, unifiedLogger, universeId],
  );

  return logConversationEvent;
};

const ExperienceAnalyticsConvAIProvider: FC<PropsWithChildren<{}>> = ({ children }) => {
  const { id: universeId } = useUniverseResource();
  const [{ [AnalyticsQueryParams.InsightId]: queryParamInsightId }] = useQueryParams([
    AnalyticsQueryParams.InsightId,
  ]);
  const insightId = useMemo(() => {
    if (!queryParamInsightId) return undefined;
    if (Array.isArray(queryParamInsightId)) return queryParamInsightId[0];

    return queryParamInsightId;
  }, [queryParamInsightId]);

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
