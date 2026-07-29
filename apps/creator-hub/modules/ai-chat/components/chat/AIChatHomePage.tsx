import type { ComponentProps, FC } from 'react';
import { useCallback } from 'react';
import {
  BarChartIcon,
  Card,
  CardActionArea,
  CardContent,
  EditIcon,
  InsightsIcon,
  Link,
  Typography,
} from '@rbx/ui';
import {
  AssistantClickEventName,
  buildChatEventEnvelope,
  logAssistantEvent,
} from '@modules/analytics-assistant/utils/AssistantLogger';
import type { FormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useExperienceAnalyticsGameDetails } from '@modules/experience-analytics-shared/context/ExperienceAnalyticsGameDetailsProvider';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { EStudioTaskType, useStudio } from '@modules/miscellaneous/hooks';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useAIChatContext } from '../../providers/AIChatProvider';

const CARD_CONTENT_SX = { padding: 3, '&:last-child': { paddingBottom: 3 } } as const;

type StarterQuestionIcon = FC<ComponentProps<typeof InsightsIcon>>;

export type StarterCardCategory = 'understand' | 'analyze' | 'take_action';

interface StarterQuestionCardProps {
  Icon: StarterQuestionIcon;
  category: StarterCardCategory;
  title: FormattedText;
  question: FormattedText;
  onSelect: (question: string, category: StarterCardCategory) => void;
}

const StarterQuestionCard: FC<StarterQuestionCardProps> = ({
  Icon,
  category,
  title,
  question,
  onSelect,
}) => {
  const handleClick = useCallback(
    () => onSelect(question, category),
    [onSelect, question, category],
  );
  return (
    <Card className='medium:basis-0 medium:grow-1 medium:shrink-1'>
      <CardActionArea onClick={handleClick} className='height-full'>
        <CardContent sx={CARD_CONTENT_SX}>
          <div className='flex flex-col gap-medium'>
            <div className='flex items-center gap-small content-action-emphasis'>
              <Icon fontSize='small' />
              <Typography variant='h6'>{title}</Typography>
            </div>
            <Typography variant='body2' color='secondary'>
              {question}
            </Typography>
          </div>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

interface AIChatHomePageProps {
  onQuestionSelect: (question: string, cardCategory: StarterCardCategory) => void;
}

const AIChatHomePage: FC<AIChatHomePageProps> = ({ onQuestionSelect }) => {
  const { tPendingTranslation, translateHTML } = useRAQIV2TranslationDependencies();
  const { id: universeId } = useUniverseResource();
  const { rootPlaceId } = useExperienceAnalyticsGameDetails();
  const { open: openStudio, dialog: studioDialog } = useStudio();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { conversationId, canSendMessage } = useAIChatContext();

  const handleOpenStudio = useCallback(() => {
    openStudio({
      task: EStudioTaskType.EditPlace,
      universeId: universeId.toString(),
      placeId: rootPlaceId.toString(),
    });
  }, [openStudio, universeId, rootPlaceId]);

  const handleSelect = useCallback(
    (question: string, cardCategory: StarterCardCategory) => {
      logAssistantEvent(unifiedLogger, AssistantClickEventName.AssistantChatStarterCardClick, {
        ...buildChatEventEnvelope({
          universeId,
          conversationId,
          isReadOnly: !canSendMessage,
          // The home page renders only before any turn exists.
          turnIndex: 0,
        }),
        cardCategory,
        question,
      });
      onQuestionSelect(question, cardCategory);
    },
    [unifiedLogger, universeId, conversationId, canSendMessage, onQuestionSelect],
  );

  const cards = [
    {
      Icon: InsightsIcon,
      category: 'understand' as const,
      key: 'Heading.AskAssistant.Card.Understand',
      title: tPendingTranslation(
        'Understand',
        'Title for the "understand" starter question card on the AI Chat home page.',
        translationKey(
          'Heading.AskAssistant.Card.Understand',
          TranslationNamespace.AnalyticsAssistant,
        ),
      ),
      question: tPendingTranslation(
        'How is my D1 retention changing for different platforms?',
        'Starter question sent to the assistant when the "understand" card is clicked.',
        translationKey(
          'Question.AskAssistant.Card.Understand',
          TranslationNamespace.AnalyticsAssistant,
        ),
      ),
    },
    {
      Icon: BarChartIcon,
      category: 'analyze' as const,
      key: 'Heading.AskAssistant.Card.Analyze',
      title: tPendingTranslation(
        'Analyze',
        'Title for the "analyze" starter question card on the AI Chat home page.',
        translationKey(
          'Heading.AskAssistant.Card.Analyze',
          TranslationNamespace.AnalyticsAssistant,
        ),
      ),
      question: tPendingTranslation(
        'How are my metrics trending over time?',
        'Starter question sent to the assistant when the "analyze" card is clicked.',
        translationKey(
          'Question.AskAssistant.Card.Analyze',
          TranslationNamespace.AnalyticsAssistant,
        ),
      ),
    },
    {
      Icon: EditIcon,
      category: 'take_action' as const,
      key: 'Heading.AskAssistant.Card.TakeAction',
      title: tPendingTranslation(
        'Take action',
        'Title for the "take action" starter question card on the AI Chat home page.',
        translationKey(
          'Heading.AskAssistant.Card.TakeAction',
          TranslationNamespace.AnalyticsAssistant,
        ),
      ),
      question: tPendingTranslation(
        'Analyze my economy and monetization metrics and tell me how I can improve',
        'Starter question sent to the assistant when the "take action" card is clicked.',
        translationKey(
          'Question.AskAssistant.Card.TakeAction',
          TranslationNamespace.AnalyticsAssistant,
        ),
      ),
    },
  ];

  return (
    <>
      <div className='flex flex-col items-center padding-large width-full'>
        <div className='flex flex-col gap-[24px] width-full max-width-[900px]'>
          <div className='flex flex-col gap-xsmall'>
            <Typography variant='h2'>
              {tPendingTranslation(
                'Ask Analytics agent',
                'Heading on the AI Chat home page (shown above the starter question cards).',
                translationKey('Heading.AskAssistant', TranslationNamespace.AnalyticsAssistant),
              )}
            </Typography>
            <Typography variant='body1' color='secondary'>
              {translateHTML(
                translationKey('Description.AskAssistant', TranslationNamespace.AnalyticsAssistant),
                [
                  {
                    opening: 'studioLinkStart',
                    closing: 'studioLinkEnd',
                    content: (chunks) => (
                      <Link
                        component='button'
                        type='button'
                        onClick={handleOpenStudio}
                        color='inherit'
                        underline='always'>
                        <strong>{chunks}</strong>
                      </Link>
                    ),
                  },
                ],
              )}
            </Typography>
          </div>

          <div className='flex flex-col gap-medium medium:flex-row'>
            {cards.map(({ Icon, category, key, title, question }) => (
              <StarterQuestionCard
                key={key}
                Icon={Icon}
                category={category}
                title={title}
                question={question}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      </div>
      {studioDialog}
    </>
  );
};

export default AIChatHomePage;
