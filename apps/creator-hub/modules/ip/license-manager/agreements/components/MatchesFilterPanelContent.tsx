import { useMemo } from 'react';
import type { UniverseContentMaturity } from '@rbx/client-content-licensing-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { brandUntranslatableText } from '@modules/analytics-translations/wrapperFunctions';
import FilterDrawerEnumChoice from '@modules/charts-generic/components/FilterDrawer/FilterDrawerEnumChoice';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useIpFamiliesQuery } from '../../../ipFamilies/hooks/ipFamily';
import { getMaturityRatingLabel, maturityRatingsList } from '../../utils/maturityRating';
import { DauRange } from './DauRangeFilterChip';
import { LifetimeVisitsRange } from './LifetimeVisitsRangeFilterChip';
import { MatchCandidateOfferStatusFilter } from './MatchCandidateOfferStatusFilterChip';

/**
 * Special value for the "All" option in the filter drawer.
 */
const allOptionValue = '--all--';

const dauRangeOptions = Object.values(DauRange);

const matchCandidateOfferStatusOptions = Object.values(MatchCandidateOfferStatusFilter);

interface Props {
  selectedIpFamilyId: string | undefined;
  selectedDauRange: DauRange | undefined;
  selectedLifetimeVisitsRange: LifetimeVisitsRange | undefined;
  selectedContentMaturities: UniverseContentMaturity[];
  selectedOfferStatusFilter?: MatchCandidateOfferStatusFilter | undefined;
  onIpFamilyChange: (selectedId: string | undefined) => void;
  onDauRangeChange: (range: DauRange | undefined) => void;
  onLifetimeVisitsRangeChange: (range: LifetimeVisitsRange | undefined) => void;
  onContentMaturityChange: (ratings: UniverseContentMaturity[]) => void;
  onOfferStatusFilterChange?: (value: MatchCandidateOfferStatusFilter | undefined) => void;
}

/**
 * Filter panel content for the Matches page.
 *
 * We're trying hard to reuse the existing filter drawer components.
 * This leads to a few odd things:
 * - FilterDrawerEnumChoice expects {@link FormattedText}; we bridge @rbx/intl strings via
 *   {@link brandUntranslatableText}.
 * - We need to provide `initialValue` and `overrideSignal` for the filters to work correctly.
 *   If you look under the hood you'll see that `overrideSignal` will set the filter value
 *   whenever it changes. This is required as filters can be edited outside of the panel.
 */
const MatchesFilterPanelContent = ({
  selectedIpFamilyId,
  selectedDauRange,
  selectedLifetimeVisitsRange,
  selectedContentMaturities,
  selectedOfferStatusFilter,
  onIpFamilyChange,
  onDauRangeChange,
  onLifetimeVisitsRangeChange,
  onContentMaturityChange,
  onOfferStatusFilterChange,
}: Props) => {
  const { translate } = useTranslation();

  const { data: ipFamiliesData, isLoading: isIpFamiliesLoading } = useIpFamiliesQuery();

  const ipFamilyOptions = useMemo(() => {
    const options = (ipFamiliesData?.ipFamilies ?? []).map((family) => family.id ?? '');
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

  const selectedOfferStatusFilterArray = useMemo(() => {
    return selectedOfferStatusFilter ? [selectedOfferStatusFilter] : [];
  }, [selectedOfferStatusFilter]);

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
    <>
      <FilterDrawerEnumChoice
        name={brandUntranslatableText(translate('Label.IpFamily'))}
        enumOptions={ipFamilyOptions}
        initial={selectedIpFamilyArray}
        overrideSignal={selectedIpFamilyArray}
        isLoading={isIpFamiliesLoading}
        onChangeSubmit={handleIpFamilyEnumChange}
        blankOption={allOptionValue}
        formatOption={(option: string) => {
          if (option === allOptionValue) {
            return brandUntranslatableText(translate('Label.Any'));
          }
          const family = ipFamiliesData?.ipFamilies.find((f) => f.id === option);
          return brandUntranslatableText(family?.name ?? translate('Label.Unknown'));
        }}
      />

      <FilterDrawerEnumChoice
        name={brandUntranslatableText(translate('Label.Status'))}
        enumOptions={matchCandidateOfferStatusOptions}
        initial={selectedOfferStatusFilterArray}
        overrideSignal={selectedOfferStatusFilterArray}
        onChangeSubmit={(selected: MatchCandidateOfferStatusFilter[]) => {
          const value = selected[0];
          onOfferStatusFilterChange?.(
            value === MatchCandidateOfferStatusFilter.All ? undefined : value,
          );
        }}
        blankOption={MatchCandidateOfferStatusFilter.All}
        formatOption={(option: MatchCandidateOfferStatusFilter) => {
          switch (option) {
            case MatchCandidateOfferStatusFilter.All:
              return brandUntranslatableText(translate('Label.All'));
            case MatchCandidateOfferStatusFilter.NoOfferSent:
              return brandUntranslatableText(translate('Label.NoOfferSent'));
            case MatchCandidateOfferStatusFilter.HasAgreement:
              return brandUntranslatableText(translate('Label.HasAgreement'));
            default:
              return brandUntranslatableText(option);
          }
        }}
      />

      <FilterDrawerEnumChoice
        name={brandUntranslatableText(translate('Label.DauRange'))}
        enumOptions={dauRangeOptions}
        initial={selectedDauRangeArray}
        overrideSignal={selectedDauRangeArray}
        onChangeSubmit={handleDauRangeEnumChange}
        blankOption={DauRange.All}
        formatOption={(option: DauRange) => {
          switch (option) {
            case DauRange.All:
              return brandUntranslatableText(translate('Label.Any'));
            case DauRange.Low:
              return brandUntranslatableText(translate('Label.DauLow'));
            case DauRange.High:
              return brandUntranslatableText(translate('Label.DauHigh'));
            default:
              return brandUntranslatableText(option);
          }
        }}
      />

      <FilterDrawerEnumChoice
        name={brandUntranslatableText(translate('Label.LifetimeVisitsRange'))}
        enumOptions={[LifetimeVisitsRange.All, LifetimeVisitsRange.Low, LifetimeVisitsRange.High]}
        initial={selectedLifetimeVisitsRangeArray}
        overrideSignal={selectedLifetimeVisitsRangeArray}
        onChangeSubmit={handleLifetimeVisitsRangeEnumChange}
        blankOption={LifetimeVisitsRange.All}
        formatOption={(option: LifetimeVisitsRange) => {
          switch (option) {
            case LifetimeVisitsRange.All:
              return brandUntranslatableText(translate('Label.All'));
            case LifetimeVisitsRange.Low:
              return brandUntranslatableText(translate('Label.LifetimeVisitsLow'));
            case LifetimeVisitsRange.High:
              return brandUntranslatableText(translate('Label.LifetimeVisitsHigh'));
            default:
              return brandUntranslatableText(option);
          }
        }}
      />

      <FilterDrawerEnumChoice
        name={brandUntranslatableText(translate('Label.ContentMaturity'))}
        enumOptions={maturityRatingsList}
        initial={selectedContentMaturities}
        overrideSignal={selectedContentMaturities}
        onChangeSubmit={onContentMaturityChange}
        formatOption={(option: UniverseContentMaturity) =>
          brandUntranslatableText(translate(getMaturityRatingLabel(option)))
        }
        multiple
      />
    </>
  );
};

export default withTranslation(MatchesFilterPanelContent, [TranslationNamespace.AgreementsManager]);
