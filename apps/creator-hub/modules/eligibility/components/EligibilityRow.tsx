import type { FunctionComponent, ReactNode } from 'react';
import React, { useMemo } from 'react';
import {
  Button,
  CheckCircleOutlineIcon,
  Grid,
  ErrorOutlineOutlinedIcon,
  Typography,
  OpenInNewIcon,
  ReportProblemOutlinedIcon,
} from '@rbx/ui';
import useEligibilityRowStyles from './EligibilityRow.styles';

export enum EligibilityStatus {
  Completed,
  Warning,
  Notice,
}

export interface EligibilityRowProps {
  descriptionText?: string | ReactNode;
  headerText: string;
  isLowerCaseLink?: boolean;
  isOpenInNewLink?: boolean;
  linkText?: string;
  onClickLink?: () => void;
  status: EligibilityStatus;
  buttonDisabled?: boolean;
  buttonSize?: 'small' | 'medium' | 'large';
  buttonStyle?: React.CSSProperties;
  hideIcon?: boolean;
}

const EligibilityRow: FunctionComponent<React.PropsWithChildren<EligibilityRowProps>> = ({
  headerText,
  descriptionText,
  isLowerCaseLink,
  isOpenInNewLink = true,
  linkText,
  onClickLink,
  status,
  buttonDisabled = false,
  buttonSize = 'small',
  buttonStyle,
  hideIcon,
}) => {
  const { classes: styles } = useEligibilityRowStyles(isLowerCaseLink)();

  const icon = useMemo(() => {
    switch (status) {
      case EligibilityStatus.Completed:
        return <CheckCircleOutlineIcon color='success' data-testid='completed-icon-id' />;
      case EligibilityStatus.Warning:
        return <ErrorOutlineOutlinedIcon color='error' data-testid='warning-icon-id' />;
      case EligibilityStatus.Notice:
      default:
        return <ReportProblemOutlinedIcon color='warning' data-testid='notice-icon-id' />;
    }
  }, [status]);

  return (
    <Grid container item direction='row' XSmall={12}>
      <Grid item XSmall='auto' className={styles.iconContainer}>
        {hideIcon ? <Grid width={20} height={20} /> : icon}
      </Grid>
      <Grid item XSmall>
        <Grid container direction='row'>
          <Grid item container direction='column' XSmall={9}>
            <Grid item className={styles.headerContainer}>
              <Typography variant='h6'>{headerText}</Typography>
            </Grid>

            {descriptionText && (
              <Grid item>
                <Typography variant='body1' color='secondary'>
                  {descriptionText}
                </Typography>
              </Grid>
            )}
          </Grid>
          {linkText && onClickLink && (
            <Grid display='flex' alignItems='flex-start' item XSmall={3}>
              <Button
                classes={{ root: styles.buttonText }}
                data-testid='eligibility-link-id'
                onClick={onClickLink}
                size={buttonSize}
                disabled={buttonDisabled}
                sx={buttonStyle}
                endIcon={isOpenInNewLink ? <OpenInNewIcon /> : null}>
                {linkText}
              </Button>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default EligibilityRow;
