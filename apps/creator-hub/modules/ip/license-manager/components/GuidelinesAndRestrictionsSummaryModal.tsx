import type { FunctionComponent } from 'react';
import { useState, useMemo, useCallback } from 'react';
import type { LicenseResponse } from '@rbx/client-content-licensing-api/v1';
import { ContentStandardAnswer } from '@rbx/client-content-licensing-api/v1';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Button, Link } from '@rbx/ui';
import { CONTENT_STANDARDS_HREF } from '@modules/licenses/urls';
import downloadPdf from '@modules/licenses/utils/downloadPdf';
import LinkButton from '../../components/LinkButton';
import { FALLBACK_CONTENT_STANDARDS_ID } from '../constants';
import { COMMUNITY_STANDARDS_HREF } from '../urls';
import AmDivider from './AmDivider';
import GenericStandardsAccordion from './GenericStandardsAccordion';
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
      ) ?? [],
    [license?.contentStandardAnswers],
  );
  const notAllowedStandards = useMemo(
    () =>
      license?.contentStandardAnswers?.filter(
        (statement) => statement.answer === ContentStandardAnswer.No,
      ) ?? [],
    [license?.contentStandardAnswers],
  );

  const handleDocumentDownload = useCallback(async () => {
    const documentId = license?.contentStandardsDocumentId;
    const licenseName = license?.name;
    if (!documentId || !licenseName) {
      return;
    }
    await downloadPdf(
      CONTENT_STANDARDS_HREF(documentId),
      translate('Label.ContentStandardsPdf', {
        licenseName,
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
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
        }
      }}
      size='Large'
      isModal
      hasCloseAffordance={false}
      data-testid='apply-to-license-guidelines-modal'>
      <DialogContent>
        <DialogTitle
          className={`${classes.dialogTitle} margin-small text-heading-small flex flex-col gap-small`}>
          {translate('Label.GuidelinesAmpersandRestrictions')}
          {!isCreator && (
            <span className='text-body-medium'>
              <strong>{translate('Label.ContentStandardsCreatorViewDisclaimer')}</strong>
            </span>
          )}
        </DialogTitle>
        <DialogBody
          className={`${classes.dialogContentExtraPadding} flex flex-col gap-small !padding-top-none`}>
          <span className='text-label-large'>{translate('Label.ScopeOfLicense')}</span>
          <span className='text-body-medium content-muted' style={{ whiteSpace: 'pre-wrap' }}>
            {license.contentStandardsScope}
          </span>

          <AmDivider />

          <span className='text-label-large'>{translate('Label.ContentStandards')}</span>
          {/* Ensures that we only render the accordion if we would have content in it */}
          {allowedStandards.length === 0 && notAllowedStandards.length === 0 ? (
            <span className='text-body-medium content-muted '>
              {translate('Label.NotApplicableLong')}
            </span>
          ) : (
            <>
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
                  hasBottomMargin={!shouldShowDownload}
                />
              )}
              {/* Note: we intentionally do not render the Not Applicable selections */}
            </>
          )}

          {shouldShowDownload && (
            <div className='flex flex-col gap-small items-start'>
              <span className='text-label-large'>{translate('Label.BrandGuidelinesOptional')}</span>
              <LinkButton onClick={handleDocumentDownload}>
                <span className='text-body-medium'>
                  <strong>{translate('Action.Download')}</strong>
                </span>
              </LinkButton>
            </div>
          )}

          <span className='text-body-medium content-muted'>
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
          </span>
        </DialogBody>
        <DialogFooter
          className={`${classes.dialogActions} flex flex-col gap-small small:flex-row small:justify-end`}>
          <Button variant='contained' color='primaryBrand' onClick={handleClose}>
            {translate('Label.OK')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GuidelinesAndRestrictionsSummaryModal;
