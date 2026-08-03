import { AgreementStatus } from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
import { Chip } from '@rbx/ui';
import Flex from '@modules/miscellaneous/components/Flex';
import { AgreementFilterKeys } from '../utils/constants';

export const iphAgreementFiltersConfig = [
  {
    labelKey: 'Label.MyRequests',
    keyName: AgreementFilterKeys.Requests,
    statusEnums: [AgreementStatus.Inquired, AgreementStatus.Accepted],
  },
  {
    labelKey: 'Label.MyOffers',
    keyName: AgreementFilterKeys.Offers,
    statusEnums: [
      AgreementStatus.Pending,
      AgreementStatus.Disputed,
      AgreementStatus.Unsuccessful,
      AgreementStatus.ConditionalOffer,
    ],
  },
  {
    labelKey: 'Label.Active',
    keyName: AgreementFilterKeys.Active,
    statusEnums: [AgreementStatus.Active],
  },
  {
    labelKey: 'Label.Inactive',
    keyName: AgreementFilterKeys.Inactive,
    statusEnums: [
      AgreementStatus.Archived,
      AgreementStatus.Terminated,
      AgreementStatus.Cancelled,
      AgreementStatus.Expired,
    ],
  },
];

export const getAgreementEnumsForFilter = (keyName: AgreementFilterKeys): AgreementStatus[] => {
  const filter = iphAgreementFiltersConfig.find((config) => config.keyName === keyName);
  return filter?.statusEnums ?? [];
};

interface AgreementTableFiltersProps {
  selectedFilter: string | undefined;
  onFilterChange: (keyName: string | undefined) => void;
  filtersWithCounts: Array<{
    labelKey: string;
    keyName: string;
    count: number;
    statusEnums: AgreementStatus[];
  }>;
}

/**
 * Displays filter chips for the agreements table.
 */
const AgreementTableFilters = ({
  selectedFilter,
  onFilterChange,
  filtersWithCounts,
}: AgreementTableFiltersProps) => {
  const { translate } = useTranslation();

  const handleFilterClick = (keyName: string) => {
    onFilterChange(selectedFilter === keyName ? undefined : keyName);
  };

  return (
    <Flex gap={8} flexWrap='wrap'>
      {filtersWithCounts.map(({ labelKey, keyName, count }) => (
        <Chip
          key={keyName}
          label={`${translate(labelKey)} (${count})`}
          color={selectedFilter === keyName ? 'primary' : 'secondary'}
          variant='filled'
          clickable
          onClick={() => handleFilterClick(keyName)}
          size='large'
        />
      ))}
    </Flex>
  );
};

export default AgreementTableFilters;
