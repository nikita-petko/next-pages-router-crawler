import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Checkbox,
  FormControlLabel,
  ExtensionIcon,
  Grid,
  Link,
  makeStyles,
  Typography,
  ListAltIcon,
  AccessTimeIcon,
  MonetizationOnIcon,
  CancelPresentationIcon,
  ShieldIcon,
  LockIcon,
} from '@rbx/ui';
import { creatorHub } from '@modules/miscellaneous/urls';

export type TransferDisclaimerContentProps = {
  isImplicationsAcknowledged: boolean;
  setIsImplicationsAcknowledged: React.Dispatch<React.SetStateAction<boolean>>;
  showReceiverContent?: boolean;
  isGroupOwned?: boolean;
};

const useStyles = makeStyles()(() => ({
  icon: {
    marginRight: 12,
  },
  heading: {
    marginBottom: 4,
  },
  description: {
    marginBottom: 24,
  },
}));

const TransferDisclaimerContent: FunctionComponent<
  React.PropsWithChildren<TransferDisclaimerContentProps>
> = ({
  isImplicationsAcknowledged,
  setIsImplicationsAcknowledged,
  showReceiverContent,
  isGroupOwned,
}) => {
  const { translate, translateHTML } = useTranslation();

  const {
    classes: { icon, heading, description },
  } = useStyles();

  return (
    <Grid container>
      {showReceiverContent ? (
        <Grid container>
          <Grid item className={icon}>
            <ShieldIcon />
          </Grid>
          <Grid item XSmall>
            <Grid container>
              <Typography variant='h6' className={heading}>
                {translate('Heading.AssumptionOfResponsibility')}
              </Typography>
              <Typography variant='captionBody' color='secondary' className={description}>
                {translate('Description.AssumptionOfResponsibility')}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      ) : (
        <Grid container>
          <Grid item className={icon}>
            <AccessTimeIcon />
          </Grid>
          <Grid item XSmall>
            <Grid container>
              <Typography variant='h6' className={heading}>
                {translate('Heading.Duration')}
              </Typography>
              <Typography variant='captionBody' color='secondary' className={description}>
                {translate('Description.Duration')}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      )}
      <Grid container>
        <Grid item className={icon}>
          <ListAltIcon />
        </Grid>
        <Grid item XSmall>
          <Grid container>
            <Typography variant='h6' className={heading}>
              {translate('Heading.Reupload')}
            </Typography>
            <Typography variant='captionBody' color='secondary' className={description}>
              {showReceiverContent
                ? translateHTML('Description.TargetReupload', [
                    {
                      opening: 'animationInfoLinkStart',
                      closing: 'animationInfoLinkEnd',
                      content: (chunks) => {
                        return (
                          <Link
                            href={creatorHub.docs.getAnimationTransferUrl()}
                            target='_blank'
                            color='inherit'>
                            {chunks}
                          </Link>
                        );
                      },
                    },
                  ])
                : translateHTML('Description.Reupload', [
                    {
                      opening: 'animationInfoLinkStart',
                      closing: 'animationInfoLinkEnd',
                      content: (chunks) => {
                        return (
                          <Link
                            href={creatorHub.docs.getAnimationTransferUrl()}
                            target='_blank'
                            color='inherit'>
                            {chunks}
                          </Link>
                        );
                      },
                    },
                  ])}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid container>
        <Grid item className={icon}>
          <CancelPresentationIcon />
        </Grid>
        <Grid item XSmall>
          <Grid container>
            <Typography variant='h6' className={heading}>
              {translate('Heading.Closure')}
            </Typography>
            <Typography variant='captionBody' color='secondary' style={{ marginBottom: 24 }}>
              {translate('Description.Closure')}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid container>
        <Grid item className={icon}>
          <ExtensionIcon />
        </Grid>
        <Grid item XSmall>
          <Grid container>
            <Typography variant='h6' className={heading}>
              {translate('Heading.ExtendedServices')}
            </Typography>
            <Typography variant='captionBody' color='secondary' className={description}>
              {translate('Description.ExtendedServices')}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid container>
        <Grid item className={icon}>
          <MonetizationOnIcon />
        </Grid>
        <Grid item XSmall>
          <Grid container>
            <Typography variant='h6' className={heading}>
              {translate('Heading.PrivateServer')}
            </Typography>
            <Typography variant='captionBody' color='secondary' className={description}>
              {showReceiverContent
                ? translate('Description.PrivateServer')
                : translate('Description.TargetPrivateServer')}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
      {isGroupOwned && (
        <Grid container>
          <Grid item className={icon}>
            <LockIcon />
          </Grid>
          <Grid item XSmall>
            <Grid container>
              <Typography variant='h6' className={heading}>
                {translate('Heading.ApiKeyImpact' /* TranslationNamespace.OwnershipTransfer */)}
              </Typography>
              <Typography variant='captionBody' color='secondary' className={description}>
                {translate('Description.ApiKeyImpact' /* TranslationNamespace.OwnershipTransfer */)}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      )}
      <FormControlLabel
        control={
          <Checkbox
            color='secondary'
            checked={isImplicationsAcknowledged}
            onChange={(e) => {
              setIsImplicationsAcknowledged(e.target.checked);
            }}
          />
        }
        label={
          <Typography variant='body2' className={description}>
            {translateHTML('Description.Acknowledgement', [
              {
                opening: 'implicationsLinkStart',
                closing: 'implicationsLinkEnd',
                content: (chunks) => {
                  return (
                    <Link
                      href={creatorHub.docs.getOwnershipTransferUrl()}
                      target='_blank'
                      color='inherit'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
        }
      />
    </Grid>
  );
};

export default TransferDisclaimerContent;
