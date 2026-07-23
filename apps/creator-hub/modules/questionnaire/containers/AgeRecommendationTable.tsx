import React, { FunctionComponent, useState, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import {
  V1Beta1ExperienceDescriptor as ExperienceDescriptor,
  V1Beta1CreatorOverrides as CreatorOverrides,
} from '@rbx/clients/experienceGuidelinesService';
import {
  V1Beta1CreatorOverridesFromJSON,
  V1Beta1GetDetailedGuidelinesResponse,
} from '@rbx/clients/experienceGuidelinesService/v1';
import { useRouter } from 'next/router';
import experienceGuidelinesServiceApiClient from '@modules/clients/experienceGuidelinesService';
import { IncreaseMaturityButton, IncreaseMaturityDialog } from '../components/IncreaseMaturity';
import useExperienceGuidelinesStyles from './ExperienceGuidelines.styles';
import InfoTooltip from '../components/InfoTooltip';
import networkRequestManager from '../implementations/QuestionnaireNetworkRequestManager';
import useQuestionnaireToast from '../hooks/useQuestionnaireToast';

interface AgeRecommendationTableProps {
  universeId: number;
  contentDescriptors: Array<ExperienceDescriptor>;
  displayName: string | null;
  creatorOverrides: CreatorOverrides | null;
  isContentMaturityEnabled: boolean;
  isIncreaseMaturityEnabled: boolean;
}

const AgeRecommendationTable: FunctionComponent<
  React.PropsWithChildren<AgeRecommendationTableProps>
> = ({
  universeId,
  contentDescriptors,
  displayName,
  creatorOverrides,
  isContentMaturityEnabled,
  isIncreaseMaturityEnabled,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { table, cell, cellIncreaseMaturity, firstColumnHeader, tooltip },
  } = useExperienceGuidelinesStyles();
  const { showToastNetworkError, showToastUserError } = useQuestionnaireToast();
  const router = useRouter();

  const [isIncreaseMaturityDialogOpen, setIsIncreaseMaturityDialogOpen] = useState<boolean>(false);
  const [increasedMaturity, setIncreasedMaturity] = useState<string>(
    (creatorOverrides?.creatorOverratedAgeRecommendation?.minimumAge ?? -1).toString(),
  );

  const openIncreaseMaturityDialog = useCallback(() => {
    setIncreasedMaturity(
      (creatorOverrides?.creatorOverratedAgeRecommendation?.minimumAge ?? -1).toString(),
    );
    setIsIncreaseMaturityDialogOpen(true);
  }, [creatorOverrides]);

  const onIncreaseMaturityDialogCancel = useCallback(() => {
    setIsIncreaseMaturityDialogOpen(false);
    setIncreasedMaturity(
      (creatorOverrides?.creatorOverratedAgeRecommendation?.minimumAge ?? -1).toString(),
    );
  }, [creatorOverrides]);

  const attemptSaveCreatorOverrides = useCallback(async () => {
    try {
      await networkRequestManager.attemptNetworkRequestWithRetry<V1Beta1GetDetailedGuidelinesResponse>(
        () =>
          experienceGuidelinesServiceApiClient.saveCreatorOverrides(
            universeId,
            V1Beta1CreatorOverridesFromJSON({
              creatorOverratedAgeRecommendation: { minimumAge: Number(increasedMaturity) },
            }),
          ),
      );
    } catch (e) {
      networkRequestManager.handleNetworkRequestFailure(
        e,
        showToastUserError,
        showToastNetworkError,
      );
    }
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- See above comment
  }, [universeId, showToastNetworkError, showToastUserError, increasedMaturity]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const onIncreaseMaturityDialogSubmit = useCallback(() => {
    // Should run once at beginning to call a series of network requests gathering preview data
    async function beginSaving() {
      setIsSubmitting(true);
      try {
        await attemptSaveCreatorOverrides();
      } finally {
        setIsSubmitting(false);
      }
    }

    beginSaving().then(() => {
      setIsIncreaseMaturityDialogOpen(false);
      router.reload();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router.reload() is stable; adding router would cause unnecessary re-renders
  }, [attemptSaveCreatorOverrides]);

  const onIncreaseMaturityChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    setIncreasedMaturity(value);
  };

  return (
    <Table aria-label={translate('Title.ComplianceTable')} className={table}>
      <TableHead>
        <TableRow>
          <TableCell className={firstColumnHeader}>
            <div className={tooltip}>
              <Typography variant='tableHead' display='inline'>
                {isContentMaturityEnabled
                  ? translate('Title.ContentMaturityBracket')
                  : translate('Title.AgeRecommendationBracket')}
              </Typography>
              <InfoTooltip
                translationKey={
                  isContentMaturityEnabled
                    ? 'Tooltip.ContentMaturityLabelRestrictionHeader'
                    : 'Tooltip.AgeRecommendationRestrictionHeader'
                }
              />
            </div>
          </TableCell>
          <TableCell className={cell}>
            <div className={tooltip}>
              <Typography variant='tableHead'>{translate('TableHead.Descriptors')}</Typography>
              <InfoTooltip translationKey='Tooltip.ContentDescriptorRestrictionHeader' />
            </div>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell className={cell}>
            <div className={cellIncreaseMaturity}>
              <Typography variant='body2'>
                {displayName ?? translate('Guidelines.UnratedDisplayName')}
              </Typography>
              {isIncreaseMaturityEnabled && creatorOverrides && (
                <IncreaseMaturityButton
                  disabled={
                    creatorOverrides?.allowedCreatorOverratedAgeRecommendations == null ||
                    creatorOverrides?.allowedCreatorOverratedAgeRecommendations.length <= 0
                  }
                  tooltipMsg={
                    displayName
                      ? translate('Tooltip.CannotIncreaseMaturity') ||
                        'Your experience’s maturity level cannot be increased further'
                      : translate('Tooltip.RetakeQuestionnaireToIncreaseMaturity') ||
                        'Please submit your answers again before increasing the maturity level'
                  }
                  onClick={openIncreaseMaturityDialog}
                />
              )}
            </div>
          </TableCell>
          <TableCell className={cell}>
            {contentDescriptors.length > 0 ? (
              <Typography variant='body2'>
                {contentDescriptors.map((contentDescriptor) => (
                  <div key={contentDescriptor.name}>{contentDescriptor.displayName}</div>
                ))}
              </Typography>
            ) : (
              <Typography variant='body2'>{translate('Message.NoFeatures')}</Typography>
            )}
          </TableCell>
        </TableRow>
      </TableBody>
      <IncreaseMaturityDialog
        open={isIncreaseMaturityDialogOpen}
        creatorOverrides={creatorOverrides as CreatorOverrides}
        onCancel={onIncreaseMaturityDialogCancel}
        onSubmit={onIncreaseMaturityDialogSubmit}
        isSubmitting={isSubmitting}
        onSelectionChange={onIncreaseMaturityChange}
        selected={increasedMaturity}
      />
    </Table>
  );
};
export default AgeRecommendationTable;
