import type { FunctionComponent } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from '@rbx/intl';
import { makeStyles, Card, CardContent, CardHeader, Typography } from '@rbx/ui';
import { Link } from '@modules/miscellaneous/components';

interface OverviewCardProps {
  heading: string;
  subheading: string;
  subheadingLink?: string;
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
const OverviewCard: FunctionComponent<OverviewCardProps> = ({
  heading,
  subheading,
  subheadingLink,
  children,
}) => {
  const { translate, translateHTML } = useTranslation();
  const {
    classes: { card, cardHeader, cardContent },
  } = useStyles();

  const subheader = subheadingLink
    ? translateHTML(subheading, [
        {
          opening: 'linkStart',
          closing: 'linkEnd',
          content(chunks) {
            return (
              <Link href={subheadingLink} target='_blank'>
                {chunks}
              </Link>
            );
          },
        },
      ])
    : translate(subheading);

  return (
    <Card className={card}>
      <CardHeader
        className={cardHeader}
        title={<Typography variant='h5'>{translate(heading)}</Typography>}
        subheader={<Typography variant='body2'>{subheader}</Typography>}
      />
      <CardContent className={cardContent}>{children}</CardContent>
    </Card>
  );
};

export default OverviewCard;
