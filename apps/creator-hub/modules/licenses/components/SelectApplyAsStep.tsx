import type { FunctionComponent } from 'react';
import { useCallback, useContext, useMemo } from 'react';
import type { LicenseResponse, LicenseType } from '@rbx/client-content-licensing-api/v1';
import { Icon, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Button, Grid } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import type { Creator } from '@modules/miscellaneous/common';
import { PageLoading } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import Flex from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import SelectedCreatorContext from '../context/SelectedCreatorContext';
import { useGetUsersGroupRolesV2 } from '../hooks/useGetGroupsDetails';
import { GROUP_OWNER_ROLESET_RANK } from '../utils/constants';
import { getCreatorEarningsRequirementText } from '../utils/creatorEarningsRequirementText';
import CreatorSelect from './CreatorSelect';

interface SelectApplyAsStepProps {
  license: LicenseResponse;
  effectiveLicenseType: LicenseType;
  onNext: () => void;
  onCancel: () => void;
}

/** First step for avatar license applications where the creator chooses user or group apply-as. */
const SelectApplyAsStep: FunctionComponent<SelectApplyAsStepProps> = ({
  license,
  effectiveLicenseType,
  onNext,
  onCancel,
}) => {
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const { selectedCreator, setSelectedCreator } = useContext(SelectedCreatorContext);
  const { user: authenticatedUser } = useAuthentication();
  const {
    data: groupMemberships,
    isPending: isGroupsPending,
    error: groupsError,
    refetch: refetchGroups,
  } = useGetUsersGroupRolesV2({
    userId: authenticatedUser?.id,
  });

  const selectLicenseOwnerLabel = tPendingTranslation(
    'Select license owner',
    'Stepper label and apply-as dropdown/heading',
    translationKey('Label.ApplyAs', TranslationNamespace.Licenses),
  );

  // Only Avatar Marketplace licenses carry an earnings requirement, so the whole section is hidden
  // for the license types that return no requirement text.
  const earningsRequirement = getCreatorEarningsRequirementText(
    license,
    effectiveLicenseType,
    translate,
    tPendingTranslation,
  );

  const ownedGroups = useMemo(() => {
    const filteredGroups =
      groupMemberships?.data?.filter(
        (groupData) => groupData.role?.rank === GROUP_OWNER_ROLESET_RANK,
      ) ?? [];
    return filteredGroups.map((groupData) => ({
      id: groupData.group?.id ?? 0,
      name: groupData.group?.name ?? '',
      roleSetName: groupData.role?.name ?? '',
      createdAt: new Date(0), // Adding this field to satisfy the Group type
    }));
  }, [groupMemberships]);

  const onSelectCreator = useCallback(
    (creator: Creator) => {
      setSelectedCreator?.(creator);
    },
    [setSelectedCreator],
  );

  const onReloadGroups = useCallback(() => {
    void refetchGroups();
  }, [refetchGroups]);

  if (isGroupsPending || selectedCreator?.creatorId == null) {
    return <PageLoading />;
  }

  if (groupsError) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        onReload={onReloadGroups}
      />
    );
  }

  return (
    <div className='flex flex-col gap-large padding-medium width-[50%]'>
      {earningsRequirement != null && (
        <section
          className='flex flex-col gap-small'
          data-testid='apply-as-eligibility-requirements'>
          <h2 className='text-heading-small content-emphasis margin-none'>
            {tPendingTranslation(
              'The license owner must meet the following eligibility requirements:',
              'Heading above eligibility requirements',
              translationKey(
                'Label.LicenseOwnerEligibilityRequirements',
                TranslationNamespace.Licenses,
              ),
            )}
          </h2>
          {/* TODO - MUS-2725 - Add eligibility check */}
          {/* TODO - MUS-2725 - Add the visual pitch requirement */}
          <div className='flex items-center gap-xsmall'>
            <p className='text-body-medium content-default margin-none'>
              {tPendingTranslation(
                'Creator minimum last 90 days earning requirement: {minCreatorEarnings}',
                'Description for the creator minimum last 90 earning requirement during the application step.',
                translationKey(
                  'Description.CreatorEarningsDescription',
                  TranslationNamespace.Licenses,
                ),
                { minCreatorEarnings: earningsRequirement.value },
              )}
            </p>
            <Tooltip
              title={earningsRequirement.label}
              description={earningsRequirement.tooltip}
              position='right-center'>
              <TooltipTrigger asChild>
                <span
                  className='inline-flex content-muted'
                  data-testid='creator-earnings-eligibility-info-icon'
                  aria-label={earningsRequirement.tooltip}>
                  <Icon name='icon-regular-circle-i' size='Small' aria-hidden />
                </span>
              </TooltipTrigger>
            </Tooltip>
          </div>
        </section>
      )}
      <CreatorSelect
        authenticatedUser={authenticatedUser}
        groups={ownedGroups}
        currentCreator={selectedCreator}
        setCurrentCreator={onSelectCreator}
        label={selectLicenseOwnerLabel}
      />
      {/* TODO - aquach - remove marginTop once StickyFooter is implemented */}
      <Grid item marginTop={6}>
        <Flex flexDirection='row' gap={10}>
          <Button
            variant='text'
            color='secondary'
            onClick={onCancel}
            data-testid='apply-to-license-step-cancel'>
            {translate('Action.Cancel')}
          </Button>
          <Button variant='contained' onClick={onNext} data-testid='apply-to-license-step-next'>
            {translate('Action.Next')}
          </Button>
        </Flex>
      </Grid>
    </div>
  );
};

export default SelectApplyAsStep;
