import { useCallback, useEffect } from 'react';
import { useFlag } from '@rbx/flags';
import { Dropdown, Menu, MenuItem } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { showDevExO18LandingPage } from '@generated/flags/creatorBusiness';
import { O18Eligibility } from '@modules/clients/creatorDevexApi';
import PageLoading from '@modules/miscellaneous/components/PageLoading';
import { PageNotFound } from '@modules/miscellaneous/error';
import useQueryParams from '@modules/miscellaneous/hooks/useQueryParams';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useDevExO18EligibilityState from '../../hooks/useDevExO18EligibilityState';
import DevExO18PageContent from './DevExO18PageContent';
import useDevExO18SelectableExperiences from './useDevExO18SelectableExperiences';
import { parseUniverseIdQueryParam, resolveSelectedUniverseId } from './utils/devExO18PageAccess';

function DevExO18PageContentContainer() {
  const { translate } = useTranslation();
  const { value: showDevExO18LandingPageEnabled } = useFlag(showDevExO18LandingPage);
  const [query, setQueryParams] = useQueryParams(['universeId']);
  const {
    data: experienceOptions = [],
    isPending: isLoadingExperiences,
    isError: isExperiencesError,
  } = useDevExO18SelectableExperiences(showDevExO18LandingPageEnabled ?? false);

  const queryUniverseId = parseUniverseIdQueryParam(query.universeId);
  const selectedUniverseId =
    isLoadingExperiences || experienceOptions.length === 0
      ? undefined
      : resolveSelectedUniverseId(experienceOptions, queryUniverseId);

  useEffect(() => {
    if (selectedUniverseId == null || selectedUniverseId === queryUniverseId) {
      return;
    }
    setQueryParams({ universeId: selectedUniverseId }, { skipHistory: true });
  }, [selectedUniverseId, queryUniverseId, setQueryParams]);

  const handleExperienceChange = useCallback(
    (value: string) => {
      const universeId = Number.parseInt(value, 10);
      if (!Number.isFinite(universeId) || universeId <= 0) {
        return;
      }
      setQueryParams({ universeId });
    },
    [setQueryParams],
  );

  const { o18Eligibility, isLoading: isLoadingEligibility } = useDevExO18EligibilityState(
    selectedUniverseId ?? 0,
  );
  const isEligible =
    selectedUniverseId != null &&
    !isLoadingEligibility &&
    o18Eligibility === O18Eligibility.Eligible;

  if (!showDevExO18LandingPageEnabled) {
    return <PageNotFound />;
  }

  if (isLoadingExperiences) {
    return <PageLoading />;
  }

  if (isExperiencesError) {
    return (
      <p className='text-body-medium content-default margin-none'>
        {translate('Message.LoadItemsError' /* TranslationNamespace.Creations */, {
          itemType: translate('Label.MyExperiences' /* TranslationNamespace.AssetTypes */),
        })}
      </p>
    );
  }

  if (experienceOptions.length === 0) {
    return (
      <p
        className='text-body-medium content-default margin-none'
        data-testid='devex-o18-no-experiences'>
        {translate('Message.NoExperiences' /* TranslationNamespace.Payouts */)}
      </p>
    );
  }

  if (selectedUniverseId == null) {
    return <PageLoading />;
  }

  return (
    <div className='flex flex-col gap-xxlarge height-full' data-testid='devex-o18-page-container'>
      <div className='flex flex-col gap-small' data-testid='devex-o18-page-header'>
        <h1 className='text-heading-large margin-none'>
          {translate(
            isEligible
              ? 'Heading.DevExO18EligiblePage'
              : 'Heading.DevExO18UpsellBanner' /* TranslationNamespace.DevEx */,
          )}
        </h1>
        <p className='text-body-large content-default margin-none'>
          {translate(
            isEligible
              ? 'Description.DevExO18EligiblePage'
              : 'Description.DevExO18IneligiblePage' /* TranslationNamespace.DevEx */,
          )}
        </p>
      </div>

      {/* Match the eligibility card's half width: 50% minus half of the column gutter. */}
      <div className='width-full medium:max-width-[calc(50%_-_var(--gap-xxlarge)/2)]'>
        <Dropdown
          label={translate('Label.EligibilityPageGamePicker' /* TranslationNamespace.DevEx */)}
          placeholder={translate(
            'Label.SelectExperience' /* TranslationNamespace.ShareLinksManagement */,
          )}
          size='Large'
          value={selectedUniverseId.toString()}
          onValueChange={handleExperienceChange}
          className='width-full'>
          <Menu>
            {experienceOptions.map((option) => (
              <MenuItem
                key={option.universeId}
                value={option.universeId.toString()}
                title={option.name}
              />
            ))}
          </Menu>
        </Dropdown>
      </div>

      <DevExO18PageContent universeId={selectedUniverseId} />
    </div>
  );
}

export default withTranslation(DevExO18PageContentContainer, [
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Creations,
  TranslationNamespace.DevEx,
  TranslationNamespace.Payouts,
  TranslationNamespace.ShareLinksManagement,
]);
