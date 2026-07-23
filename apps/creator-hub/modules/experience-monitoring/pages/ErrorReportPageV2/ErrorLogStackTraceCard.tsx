import type { FC } from 'react';
import type { TTheme } from '@rbx/ui';
import { makeStyles } from '@rbx/ui';

const useStyles = makeStyles()((theme: TTheme) => ({
  card: {
    margin: theme.spacing(0, 2, 1.5, 2),
    border: `1px solid ${theme.palette.components.divider}`,
    borderRadius: theme.shape.borderRadius * 2,
    padding: theme.spacing(1.5, 2),
    fontFamily: theme.typography.code.fontFamily,
    fontSize: 14,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
}));

type Props = {
  text: string;
};

const ErrorLogStackTraceCard: FC<Props> = ({ text }) => {
  const { classes } = useStyles();
  return <div className={classes.card}>{text}</div>;
};

export default ErrorLogStackTraceCard;
