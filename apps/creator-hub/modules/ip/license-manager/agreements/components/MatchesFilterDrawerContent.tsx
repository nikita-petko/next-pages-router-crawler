import { Fragment, useMemo } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { FilterDrawerEnumChoice } from '@modules/charts-generic';
import { FormattedText } from '@modules/analytics-translations';
import { UniverseContentMaturity } from '@rbx/clients/contentLicensingApi/v1';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

import { DauRange } from './DauRangeFilterChip';
import { LifetimeVisitsRange } from './LifetimeVisitsRangeFilterChip';
import { useIpFamiliesQuery } from '../../../ipFamilies/hooks/ipFamily';
import { getMaturityRatingLabel, maturityRatingsList } from '../../utils/maturityRating';

/**
 * Special value for the "All" option in the filter drawer.
 */
const allOptionValue = '--all--';

const dauRangeOptions = Object.values(DauRange);

interface Props {
  selectedIpFamilyId: string | undefined;
  selectedDauRange: DauRange | undefined;
  selectedLifetimeVisitsRange: LifetimeVisitsRange | undefined;
  selectedContentMaturities: UniverseContentMaturity[];
  onIpFamilyChange: (selectedId: string | undefined) => void;
  onDauRangeChange: (range: DauRange | undefined) => void;
  onLifetimeVisitsRangeChange: (range: LifetimeVisitsRange | undefined) => void;
  onContentMaturityChange: (ratings: UniverseContentMaturity[]) => void;
}

/**
 * Filter drawer content for the Matches page.
 *
 * We're trying hard to reuse the existing filter drawer components.
 * This leads to a few odd things:
 * - We have to cast pretty much all text to `FormattedText`
 * - We need to provide `initialValue` and `overrideSignal` for the filters to work correctly.
 *   If you look under the hood you'll see that `overrideSignal` will set the filter value
 *   whenever it changes. This is required as filters can be edited outside of the drawer.
 */
const MatchesFilterDrawerContent = ({
  selectedIpFamilyId,
  selectedDauRange,
  selectedLifetimeVisitsRange,
  selectedContentMaturities,
  onIpFamilyChange,
  onDauRangeChange,
  onLifetimeVisitsRangeChange,
  onContentMaturityChange,
}: Props) => {
  const { translate } = useTranslation();

  const { data: ipFamiliesData, isLoading: isIpFamiliesLoading } = useIpFamiliesQuery();

  const ipFamilyOptions = useMemo(() => {
    const options = (ipFamiliesData?.ipFamilies || []).map((family) => family.id || '');
    return [allOptionValue, ...options];
  }, [ipFamiliesData?.ipFamilies]);

  const selectedIpFamilyArray = useMemo(() => {
    return selectedIpFamilyId ? [selectedIpFamilyId] : [];
  }, [selectedIpFamilyId]);

  const selectedDauRangeArray = useMemo(() => {
    return selectedDauRange ? [selectedDauRange] : [];
  }, [selectedDauRange]);

  const selectedLifetimeVisitsRangeArray = useMemo(() => {
    return selectedLifetimeVisitsRange ? [selectedLifetimeVisitsRange] : [];
  }, [selectedLifetimeVisitsRange]);

  const handleIpFamilyEnumChange = (selected: string[]) => {
    const value = selected[0];
    onIpFamilyChange(value === allOptionValue ? undefined : value);
  };

  const handleDauRangeEnumChange = (selected: DauRange[]) => {
    const value = selected[0];
    onDauRangeChange(value === DauRange.All ? undefined : value);
  };

  const handleLifetimeVisitsRangeEnumChange = (selected: LifetimeVisitsRange[]) => {
    const value = selected[0];
    onLifetimeVisitsRangeChange(value === LifetimeVisitsRange.All ? undefined : value);
  };

  return (
    <Fragment>
      <FilterDrawerEnumChoice
        name={translate('Label.IpFamily') as FormattedText}
        enumOptions={ipFamilyOptions}
        initial={selectedIpFamilyArray}
        overrideSignal={selectedIpFamilyArray}
        isLoading={isIpFamiliesLoading}
        onChangeSubmit={handleIpFamilyEnumChange}
        blankOption={allOptionValue}
        formatOption={(option: string) => {
          if (option === allOptionValue) {
            return translate('Label.Any') as FormattedText;
          }
          const family = ipFamiliesData?.ipFamilies.find((f) => f.id === option);
          return (family?.name || translate('Label.Unknown')) as FormattedText;
        }}
      />

      <FilterDrawerEnumChoice
        name={translate('Label.DauRange') as FormattedText}
        enumOptions={dauRangeOptions}
        initial={selectedDauRangeArray}
        overrideSignal={selectedDauRangeArray}
        onChangeSubmit={handleDauRangeEnumChange}
        blankOption={DauRange.All}
        formatOption={(option: DauRange) => {
          switch (option) {
            case DauRange.All:
              return translate('Label.Any') as FormattedText;
            case DauRange.Low:
              return translate('Label.DauLow') as FormattedText;
            case DauRange.High:
              return translate('Label.DauHigh') as FormattedText;
            default:
              return option as FormattedText;
          }
        }}
      />

      <FilterDrawerEnumChoice
        name={translate('Label.LifetimeVisitsRange') as FormattedText}
        enumOptions={[LifetimeVisitsRange.All, LifetimeVisitsRange.Low, LifetimeVisitsRange.High]}
        initial={selectedLifetimeVisitsRangeArray}
        overrideSignal={selectedLifetimeVisitsRangeArray}
        onChangeSubmit={handleLifetimeVisitsRangeEnumChange}
        blankOption={LifetimeVisitsRange.All}
        formatOption={(option: LifetimeVisitsRange) => {
          switch (option) {
            case LifetimeVisitsRange.All:
              return translate('Label.All') as FormattedText;
            case LifetimeVisitsRange.Low:
              return translate('Label.LifetimeVisitsLow') as FormattedText;
            case LifetimeVisitsRange.High:
              return translate('Label.LifetimeVisitsHigh') as FormattedText;
            default:
              return option as FormattedText;
          }
        }}
      />

      <FilterDrawerEnumChoice
        name={translate('Label.ContentMaturity') as FormattedText}
        enumOptions={maturityRatingsList}
        initial={selectedContentMaturities}
        overrideSignal={selectedContentMaturities}
        onChangeSubmit={onContentMaturityChange}
        formatOption={(option: UniverseContentMaturity) =>
          translate(getMaturityRatingLabel(option)) as FormattedText
        }
        multiple
      />
    </Fragment>
  );
};

export default withTranslation(MatchesFilterDrawerContent, [
  TranslationNamespace.AgreementsManager,
]);
