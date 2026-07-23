import React from 'react';
import { Checkbox, FormControlLabel, Grid, makeStyles, Typography } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/common/components';
import { useTranslation } from '@rbx/intl';
import { getTransferDisclaimerContent } from '../constants/contentConstants';
import { useOwnershipTransferDialogInternalState } from '../providers/OwnershipTransferDialogInternalStateProvider';
import { TModalStageComponentProps } from '../transferConfiguration';

type TTransferDisclaimerContentProps = TModalStageComponentProps;
const useStyles = makeStyles()(() => ({
  icon: {
    marginRight: 9,
    paddingTop: 2,
  },
  heading: {
    marginBottom: 4,
  },
  description: {},
}));

const TransferDisclaimerContent: React.FC<TTransferDisclaimerContentProps> = ({
  variant = null,
  resource,
}) => {
  const { translate } = useTranslation();

  const { classes } = useStyles();

  const { acknowledgedTransferTerms, setAcknowledgedTransferTerms } =
    useOwnershipTransferDialogInternalState();

  const transferDisclaimerContent = getTransferDisclaimerContent(variant, resource.resourceType);

  return (
    <Flex flexDirection='column' gap={24}>
      {transferDisclaimerContent.map(({ IconComponent, title, description }) => (
        <Grid key={title} container>
          <Grid item className={classes.icon}>
            <IconComponent />
          </Grid>
          <Grid item XSmall>
            <Grid container>
              <Grid item XSmall={12}>
                <Typography variant='h6' className={classes.heading}>
                  {translate(title)}
                </Typography>
              </Grid>
              <Typography variant='captionBody' color='secondary' className={classes.description}>
                {translate(description)}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      ))}

      <FormControlLabel
        control={
          <Checkbox
            data-testid='transfer-disclaimer-implication-acknowledgement-checkbox'
            color='secondary'
            checked={acknowledgedTransferTerms}
            onChange={(e) => {
              setAcknowledgedTransferTerms(e.target.checked);
            }}
          />
        }
        label={
          <Typography variant='body2' className={classes.description}>
            {translate('Description.AcknowledgementNoLink')}
          </Typography>
        }
      />
    </Flex>
  );
};

export default TransferDisclaimerContent;
