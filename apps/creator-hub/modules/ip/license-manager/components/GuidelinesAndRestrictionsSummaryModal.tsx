import { FunctionComponent, useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Link,
  DialogActions,
  Button,
  Grid,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { CONTENT_STANDARDS_HREF } from '@modules/licenses/urls';
import downloadPdf from '@modules/licenses/utils/downloadPdf';
import { ContentStandardAnswer, LicenseResponse } from '@rbx/clients/contentLicensingApi/v1';

import GenericStandardsAccordion from './GenericStandardsAccordion';
import { COMMUNITY_STANDARDS_HREF } from '../urls';
import LinkButton from '../../components/LinkButton';
import AmDivider from './AmDivider';
import { FALLBACK_CONTENT_STANDARDS_ID } from '../constants';
import useGuidelinesAndRestrictionsModalStyles from './GuidelinesAndRestrictionsSummaryModal.styles';

interface GuidelinesAndRestrictionsSummaryModalProps {
  isOpen: boolean;
  license: LicenseResponse | null;
  isCreator?: boolean;
  setOpen: (open: boolean) => void;
}

/** GuidelinesAndRestrictionsSummaryModal is a comprehensive view of the license's scope,
 * selected content standards, and brand guidelines (if provided). */
const GuidelinesAndRestrictionsSummaryModal: FunctionComponent<
  GuidelinesAndRestrictionsSummaryModalProps
> = ({ isOpen, license, isCreator = false, setOpen }) => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = useGuidelinesAndRestrictionsModalStyles();

  const [isAllowedExpanded, setIsAllowedExpanded] = useState<boolean>(true);
  const [isNotAllowedExpanded, setIsNotAllowedExpanded] = useState<boolean>(true);

  const shouldShowDownload = useMemo(
    () =>
      license?.contentStandardsDocumentId &&
      license.contentStandardsDocumentId !== FALLBACK_CONTENT_STANDARDS_ID,
    [license?.contentStandardsDocumentId],
  );

  const allowedStandards = useMemo(
    () =>
      license?.contentStandardAnswers?.filter(
        (statement) => statement.answer === ContentStandardAnswer.Yes,
      ) || [],
    [license?.contentStandardAnswers],
  );
  const notAllowedStandards = useMemo(
    () =>
      license?.contentStandardAnswers?.filter(
        (statement) => statement.answer === ContentStandardAnswer.No,
      ) || [],
    [license?.contentStandardAnswers],
  );

  const handleDocumentDownload = useCallback(async () => {
    if (!license) return;
    await downloadPdf(
      CONTENT_STANDARDS_HREF(license.contentStandardsDocumentId!),
      translate('Label.ContentStandardsPdf', {
        licenseName: license.name!,
      }),
    );
  }, [license, translate]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setIsAllowedExpanded(true);
    setIsNotAllowedExpanded(true);
  }, [setOpen]);

  if (!license) {
    return null;
  }

  return (
    <Dialog
      maxWidth='Medium'
      open={isOpen}
      onClose={handleClose}
      data-testid='apply-to-license-guidelines-modal'>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant='h4'>{translate('Label.GuidelinesAmpersandRestrictions')}</Typography>
        {!isCreator && (
          <Grid item>
            <Typography variant='body2' color='primary'>
              <strong>{translate('Label.ContentStandardsCreatorViewDisclaimer')}</strong>
            </Typography>
          </Grid>
        )}
      </DialogTitle>
      <DialogContent className={classes.dialogContentExtraPadding}>
        <Grid container flexDirection='column' spacing={1}>
          <Grid item>
            <Typography variant='body1' color='primary'>
              <strong>{translate('Label.ScopeOfLicense')}</strong>
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2' color='secondary' whiteSpace='pre-wrap'>
              {license.contentStandardsScope}
            </Typography>
          </Grid>

          <Grid>
            <AmDivider hasTopMargin />
          </Grid>

          <Grid item>
            <Typography variant='body1' color='primary'>
              <strong>{translate('Label.ContentStandards')}</strong>
            </Typography>
          </Grid>
          <Grid item>
            {/* Ensures that we only render the accordion if we would have content in it */}
            {allowedStandards.length === 0 && notAllowedStandards.length === 0 ? (
              <div>
                <Typography variant='body2' color='secondary'>
                  {translate('Label.NotApplicableLong')}
                </Typography>
              </div>
            ) : (
              <div>
                {allowedStandards.length > 0 && (
                  <GenericStandardsAccordion
                    isAccordionOpen={isAllowedExpanded}
                    setIsOpen={setIsAllowedExpanded}
                    title={translate('Label.Allowed')}
                    statementsToShow={allowedStandards}
                  />
                )}
                {notAllowedStandards.length > 0 && (
                  <GenericStandardsAccordion
                    isAccordionOpen={isNotAllowedExpanded}
                    setIsOpen={setIsNotAllowedExpanded}
                    title={translate('Label.NotAllowed')}
                    statementsToShow={notAllowedStandards}
                  />
                )}
                {/* Note: we intentionally do not render the Not Applicable selections */}
              </div>
            )}
          </Grid>

          {shouldShowDownload && (
            <Grid item container flexDirection='column' spacing={1} className={classes.text}>
              <Grid item>
                <Typography variant='body1' color='primary' gutterBottom>
                  <strong>{translate('Label.BrandGuidelinesOptional')}</strong>
                </Typography>
              </Grid>
              <Grid item>
                <LinkButton onClick={handleDocumentDownload}>
                  <Typography variant='body1'>{translate('Action.Download')}</Typography>
                </LinkButton>
              </Grid>
            </Grid>
          )}

          <Grid item>
            <Typography variant='body2' color='secondary'>
              {translateHTML('Label.InAdditionCommunityStandards', [
                {
                  opening: 'startLink',
                  closing: 'endLink',
                  content(chunks) {
                    return (
                      <Link
                        href={COMMUNITY_STANDARDS_HREF}
                        target='_blank'
                        style={{ textDecoration: 'underline' }}
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
      </DialogContent>

      <DialogActions className={classes.dialogActions}>
        <Button size='medium' variant='contained' color='primaryBrand' onClick={handleClose}>
          {translate('Label.OK')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GuidelinesAndRestrictionsSummaryModal;
