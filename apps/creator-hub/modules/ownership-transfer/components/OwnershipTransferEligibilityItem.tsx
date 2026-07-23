import { useTranslation } from '@rbx/intl';
import {
  Typography,
  CheckCircleOutlineIcon,
  CancelOutlinedIcon,
  LaunchIcon,
  Button,
  makeStyles,
} from '@rbx/ui';
import Flex from '@modules/miscellaneous/components/Flex';
import type { TOwnershipTransferEligibilityContent } from '../constants/contentConstants';

const useStyles = makeStyles()(() => ({
  itemContainer: {
    paddingBottom: 16,
  },
  textContainer: {
    paddingTop: 8,
    paddingBottom: 0,
  },
  iconContainer: {
    marginLeft: 4,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  actionContainer: {
    marginTop: 8,
  },
}));

export type TOwnershipTransferEligibilityItemProps = Omit<
  TOwnershipTransferEligibilityContent,
  'actionLink'
> & {
  isPassing: boolean;
  actionLink?: string;
};

const OwnershipTransferEligibilityItem = ({
  title,
  description,
  actionText,
  actionLink,
  isPassing,
}: TOwnershipTransferEligibilityItemProps) => {
  const { classes } = useStyles();

  const { translate } = useTranslation();

  return (
    <div className={classes.itemContainer}>
      <Flex flexDirection='column'>
        <Flex flexDirection='row' justifyContent='space-between' alignItems='center'>
          <div className={classes.textContainer}>
            <div>
              <Typography variant='h6'>{translate(title)}</Typography>
            </div>
            <div>
              <Typography variant='captionBody'>{translate(description)}</Typography>
            </div>
          </div>
          <div className={classes.iconContainer}>
            {isPassing ? (
              <CheckCircleOutlineIcon color='success' />
            ) : (
              <CancelOutlinedIcon color='error' />
            )}
          </div>
        </Flex>
        {!isPassing && !!actionLink && !!actionText && (
          <div className={classes.actionContainer}>
            <Button
              href={actionLink}
              component='a'
              target='_blank'
              size='small'
              variant='contained'
              color='secondary'
              endIcon={<LaunchIcon />}>
              {translate(actionText)}
            </Button>
          </div>
        )}
      </Flex>
    </div>
  );
};

export default OwnershipTransferEligibilityItem;
