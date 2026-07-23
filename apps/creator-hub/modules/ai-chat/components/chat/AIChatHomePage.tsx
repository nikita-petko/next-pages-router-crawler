import React, { FC } from 'react';
import {
  Typography,
  Card,
  CardContent,
  makeStyles,
  InsightsIcon,
  TuneIcon,
  SettingsIcon,
} from '@rbx/ui';

const useAIChatHomePageStyles = makeStyles()((theme) => ({
  container: {
    padding: theme.spacing(4),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  header: {
    textAlign: 'center',
    marginBottom: theme.spacing(4),
    maxWidth: '800px',
  },
  cardsContainer: {
    marginBottom: theme.spacing(4),
    width: '100%',
    maxWidth: '900px',
  },
  cardsGrid: {
    display: 'flex',
    gap: theme.spacing(3),
    flexDirection: 'column', // Default: stack vertically (mobile-first)

    // Desktop: 3 cards in one row
    [theme.breakpoints.up('Large')]: {
      flexDirection: 'row',
      flexWrap: 'nowrap', // Prevent wrapping - always keep in one row
      '& > div': {
        flex: '1 1 0', // Equal width distribution
        minWidth: 0, // Allow cards to shrink if needed
      },
    },
  },
  questionCard: {
    height: '200px',
    cursor: 'pointer',
    backgroundColor: theme.palette.surface[100],
  },
  cardContent: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: theme.spacing(3),
  },
  cardIcon: {
    marginBottom: theme.spacing(2),
    fontSize: '32px',
    color: theme.palette.actionV2.primaryBrand.fill,
  },
  cardTitle: {
    marginBottom: theme.spacing(1),
    fontWeight: 600,
  },
  cardDescription: {
    color: theme.palette.content.muted,
    fontSize: '14px',
    lineHeight: 1.4,
  },
}));

interface AIChatHomePageProps {
  onQuestionSelect: (question: string) => void;
}

const AIChatHomePage: FC<AIChatHomePageProps> = ({ onQuestionSelect }) => {
  const { classes } = useAIChatHomePageStyles();

  const questionCards = [
    {
      icon: <InsightsIcon className={classes.cardIcon} />,
      title: 'Understand',
      description: 'What is my D1 retention rate?',
      question: 'What is my D1 retention rate?',
    },
    {
      icon: <TuneIcon className={classes.cardIcon} />,
      title: 'Analyze',
      description: 'How are my metrics trending over time? Analyze patterns and performance.',
      question: 'How are my metrics trending over time?',
    },
    {
      icon: <SettingsIcon className={classes.cardIcon} />,
      title: 'Take action',
      description: 'What strategies can help improve user engagement and retention?',
      question: 'What strategies can help improve user engagement?',
    },
  ];

  const handleCardClick = (question: string) => {
    if (question) {
      onQuestionSelect(question);
    }
  };

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Typography variant='body1' color='secondary'>
          Include detailed context and examples in your question to get the best response. Ask a
          question about your analytics data and get insights to help grow your experience.
        </Typography>
      </div>

      <div className={classes.cardsContainer}>
        <Typography variant='h6' gutterBottom>
          Tap to ask a question:
        </Typography>

        <div className={classes.cardsGrid}>
          {questionCards.map((card) => (
            <div key={card.title}>
              <Card
                className={classes.questionCard}
                onClick={() => handleCardClick(card.question)}
                style={{ opacity: card.question ? 1 : 0.6 }}>
                <CardContent className={classes.cardContent}>
                  {card.icon}
                  <Typography variant='h6' className={classes.cardTitle}>
                    {card.title}
                  </Typography>
                  <Typography className={classes.cardDescription}>{card.description}</Typography>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIChatHomePage;
