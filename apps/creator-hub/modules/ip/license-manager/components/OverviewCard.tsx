import type { FunctionComponent } from 'react';
import type { ReactNode } from 'react';
import { makeStyles, Card, CardContent, CardHeader, Typography } from '@rbx/ui';

interface OverviewCardProps {
  heading: ReactNode;
  subheading: ReactNode;
  children?: ReactNode;
}

const useStyles = makeStyles()(() => ({
  card: {
    padding: '16px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    padding: '8px 16px',
    '& .MuiCardHeader-content': {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
  },
  cardContent: {
    paddingTop: '0px',
    paddingBottom: '0px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    '&:last-child': {
      paddingBottom: '0px',
    },
  },
}));

/** A card that displays a title, subtitle and child components containing analytics information */
const OverviewCard: FunctionComponent<OverviewCardProps> = ({ heading, subheading, children }) => {
  const {
    classes: { card, cardHeader, cardContent },
  } = useStyles();

  return (
    <Card className={card}>
      <CardHeader
        className={cardHeader}
        title={<Typography variant='h5'>{heading}</Typography>}
        subheader={<Typography variant='body2'>{subheading}</Typography>}
      />
      <CardContent className={cardContent}>{children}</CardContent>
    </Card>
  );
};

export default OverviewCard;
