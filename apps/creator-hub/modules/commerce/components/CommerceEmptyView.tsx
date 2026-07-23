import { makeStyles, Grid, Typography, Button } from '@rbx/ui';
import CommerceEmptyContainer from './CommerceEmptyContainer';

interface CommerceItemsEmptyViewProps {
  iconPath: string;
  message: string;
  description: string;
  buttonText?: string;
  buttonColor?: 'primaryBrand' | 'secondary';
  onButtonClick?: () => void;
}

const useStyles = makeStyles()(() => ({
  text: {
    maxWidth: 480,
  },
}));

const CommerceEmptyView = ({
  iconPath,
  message,
  description,
  buttonText,
  buttonColor = 'primaryBrand',
  onButtonClick,
}: CommerceItemsEmptyViewProps) => {
  const { classes } = useStyles();

  return (
    <CommerceEmptyContainer>
      <img src={iconPath} alt={description} height={160} />
      <Grid
        item
        container
        direction='column'
        justifyContent='center'
        alignItems='center'
        rowGap={1}>
        <Typography variant='h2' color='primary' className={classes.text}>
          {message}
        </Typography>
        <Typography variant='body1' color='secondary' className={classes.text}>
          {description}
        </Typography>
      </Grid>
      {buttonText && (
        <Grid item marginTop={1}>
          <Button variant='contained' color={buttonColor} size='large' onClick={onButtonClick}>
            {buttonText}
          </Button>
        </Grid>
      )}
    </CommerceEmptyContainer>
  );
};

export default CommerceEmptyView;
