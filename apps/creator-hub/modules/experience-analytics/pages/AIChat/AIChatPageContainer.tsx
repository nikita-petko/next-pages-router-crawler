import React, { FC, useCallback, useRef } from 'react';
import { useUniverseResource } from '@modules/experience-analytics-shared';
import AIChatPage from '@modules/ai-chat/components/layout/AIChatPage';
import { AIChatProvider } from '@modules/ai-chat/providers/AIChatProvider';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useRouter } from 'next/router';
import { PageLoading } from '@modules/miscellaneous/common';
import { ErrorPage } from '@modules/miscellaneous/error';
import { AnalyticsQueryParams } from '@modules/charts-generic';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { useGetConversationHistory } from '@modules/analytics-assistant/hooks/useGetConversationHistory';

const ExperienceAnalyticsAIChatPageContainer: FC = () => {
  const router = useRouter();
  const { id: universeId } = useUniverseResource();

  const { isAnalyticsAssistantChatEnabled, isFetched } = useFeatureFlagsForNamespace(
    'isAnalyticsAssistantChatEnabled',
    FeatureFlagNamespace.Analytics,
  );

  const [{ [AnalyticsQueryParams.ConversationId]: conversationId }, setQueryParamValues] =
    useQueryParams([AnalyticsQueryParams.ConversationId]);

  const normalizedConversationId = Array.isArray(conversationId)
    ? conversationId[0]
    : (conversationId ?? undefined);

  // Track if we had a conversationId on mount (loading existing convo)
  const initialConversationIdRef = useRef(normalizedConversationId);

  // Only fetch history if we're loading an existing conversation
  const { isLoading, error, initialMessages } = useGetConversationHistory(
    initialConversationIdRef.current ? normalizedConversationId : undefined,
    universeId,
  );

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
    router.replace('/404');
    return null;
  }

  if (error) {
    return <ErrorPage errorCode={400} />;
  }

  return (
    <AIChatProvider
      universeId={universeId}
      conversationId={normalizedConversationId}
      initialMessages={initialMessages}
      onConversationCreated={handleConversationCreated}>
      <AIChatPage />
    </AIChatProvider>
  );
};

export default ExperienceAnalyticsAIChatPageContainer;
