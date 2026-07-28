/* oxlint-disable react/react-compiler -- pre-existing query-param hook destructuring is not React Compiler compatible */
import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useFlag } from '@rbx/flags';
import { isAnalyticsAssistantChatEnabled as isAnalyticsAssistantChatEnabledFlag } from '@generated/flags/creatorAnalytics';
import AIChatPage from '@modules/ai-chat/components/layout/AIChatPage';
import { AIChatProvider } from '@modules/ai-chat/providers/AIChatProvider';
import { useGetConversation } from '@modules/analytics-assistant/hooks/useGetConversation';
import { useGetConversationHistory } from '@modules/analytics-assistant/hooks/useGetConversationHistory';
import type { AnalyticsChatMessage } from '@modules/analytics-assistant/types/AnalyticsChatTypes';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useQueryParams } from '@modules/miscellaneous/hooks';

const EMPTY_MESSAGES: AnalyticsChatMessage[] = [];

const ExperienceAnalyticsAIChatPageContainer: FC = () => {
  const router = useRouter();
  const { id: universeId } = useUniverseResource();
  const [hasUniverseMismatch, setHasUniverseMismatch] = useState(false);

  const { ready: isFetched, value: isAnalyticsAssistantChatEnabledValue } = useFlag(
    isAnalyticsAssistantChatEnabledFlag,
  );
  const isAnalyticsAssistantChatEnabled = isFetched && isAnalyticsAssistantChatEnabledValue;

  const [{ [AnalyticsQueryParams.ConversationId]: conversationId }, setQueryParamValues] =
    useQueryParams([AnalyticsQueryParams.ConversationId]);

  const normalizedConversationId = Array.isArray(conversationId)
    ? conversationId[0]
    : (conversationId ?? undefined);

  // Track if we had a conversationId on mount (loading existing convo)
  const initialConversationIdRef = useRef(normalizedConversationId);

  // Only fetch history if we're loading an existing conversation. Once a universe
  // mismatch is detected we treat the page as a fresh chat, so we stop loading the
  // (other universe's) conversation and avoid re-fetching when the recovered chat
  // creates its own conversation.
  const shouldLoadExistingConversation =
    Boolean(initialConversationIdRef.current) && !hasUniverseMismatch;

  const {
    isLoading: isConversationLoading,
    error: conversationError,
    data: conversationData,
  } = useGetConversation(
    shouldLoadExistingConversation ? normalizedConversationId : undefined,
    universeId,
  );

  const {
    isLoading: isHistoryLoading,
    error: historyError,
    initialMessages,
    inProgressMessageId,
    shouldResume,
  } = useGetConversationHistory(
    shouldLoadExistingConversation ? normalizedConversationId : undefined,
    universeId,
  );

  const isLoading = shouldLoadExistingConversation && (isConversationLoading || isHistoryLoading);
  const error = conversationError ?? historyError;

  const metaUniverseId = conversationData?.conversation?.metadata?.universeId;
  const detectedUniverseMismatch =
    shouldLoadExistingConversation &&
    universeId > 0 &&
    metaUniverseId != null &&
    metaUniverseId !== universeId;

  useEffect(() => {
    if (!detectedUniverseMismatch) {
      return;
    }
    setHasUniverseMismatch(true);
    setQueryParamValues(
      { [AnalyticsQueryParams.ConversationId]: undefined },
      { skipHistory: true },
    );
  }, [detectedUniverseMismatch, setQueryParamValues]);

  const universeMismatch = detectedUniverseMismatch || hasUniverseMismatch;
  const effectiveConversationId = universeMismatch ? undefined : normalizedConversationId;
  const effectiveInitialMessages = universeMismatch ? EMPTY_MESSAGES : initialMessages;
  const effectiveInProgressMessageId = universeMismatch ? undefined : inProgressMessageId;
  const effectiveShouldResume = universeMismatch ? false : shouldResume;
  const effectiveCanSendMessage = universeMismatch
    ? true
    : (conversationData?.conversation?.permissions?.canSendMessage ??
      !shouldLoadExistingConversation);

  const handleConversationCreated = useCallback(
    (newConversationId: string) => {
      setQueryParamValues({ [AnalyticsQueryParams.ConversationId]: newConversationId });
    },
    [setQueryParamValues],
  );

  if (!isFetched || isLoading) {
    return <PageLoading />;
  }

  if (!isAnalyticsAssistantChatEnabled && isFetched) {
    void router.replace('/404');
    return null;
  }

  if (error) {
    return <ErrorPage errorCode={400} />;
  }

  return (
    <AIChatProvider
      universeId={universeId}
      conversationId={effectiveConversationId}
      initialMessages={effectiveInitialMessages}
      inProgressMessageId={effectiveInProgressMessageId}
      shouldResume={effectiveShouldResume}
      onConversationCreated={handleConversationCreated}
      canSendMessage={effectiveCanSendMessage}>
      <AIChatPage />
    </AIChatProvider>
  );
};

export default ExperienceAnalyticsAIChatPageContainer;
