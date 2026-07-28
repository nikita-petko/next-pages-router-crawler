import { Fragment } from 'react';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import {
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Link,
  LaunchIcon,
} from '@rbx/ui';

interface AgeVerifiedOAuthDialogCardProps {
  onCancel: () => void;
  translate: (key: string, args?: { [key: string]: string }) => string;
  translateHTML: (
    key: string,
    tags?:
      | {
          opening: string;
          closing: string;
          content: (chunks: React.ReactNode) => React.ReactNode;
        }[]
      | null,
    args?: {
      [key: string]: React.ReactNode;
    },
  ) => React.ReactNode;
}

const AgeVerifiedOAuthDialogCard = ({
  onCancel,
  translate,
  translateHTML,
}: AgeVerifiedOAuthDialogCardProps) => {
  return (
    <>
      <DialogTitle>{translate('Heading.OAuthAgeVerification')}</DialogTitle>
      <DialogContent dividers>
        <DialogContentText id='dialog-content-text-describe-id'>
          <Fragment>
            <Typography component='p'>
              {translateHTML('Message.OAuthVerificationRequirements', [
                {
                  opening: 'linkStart',
                  closing: 'linkEnd',
                  // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
                  // responsible for triaging issue.
                  content(chunks) {
                    return (
                      <Link
                        href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/publishing/account-verification`}
                        target='_blank'
                        underline='always'>
                        {chunks}
                      </Link>
                    );
                  },
                },
              ])}
            </Typography>

            <br />
            <Typography component='p'>
              {translate('Message.OAuthAgeVerificationInstructions')}
            </Typography>
          </Fragment>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant='outlined'
          aria-label={translate('Label.Cancel')}
          color='primary'
          onClick={onCancel}>
          {translate('Label.Cancel')}
        </Button>
        <Button variant='contained' color='primaryBrand'>
          <Link
            href={`https://www.${process.env.robloxSiteDomain}/my/account#!/info`}
            target='_blank'
            color='inherit'
            style={{ display: 'inline-flex' }}>
            {translate('Label.Verify')}
            <LaunchIcon fontSize='small' color='inherit' />
          </Link>
        </Button>
      </DialogActions>
    </>
  );
};

export default AgeVerifiedOAuthDialogCard;
