import type { FC } from 'react';
import { useCallback } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import type { FormattedText } from '@modules/analytics-translations/types';
import ControlledFilterEnumChoice from '@modules/charts-generic/components/ControlledFilterEnumChoice';
import { UniverseSessionExitReason } from '@modules/clients/analytics/universeSessionMetadataApi';
import useClientSessionStatusLabels from '../hooks/useClientSessionStatusLabels';
import type { SessionBrowserDrawerFilters } from '../types/SessionBrowserFilters';

const EXIT_REASON_FILTER_OPTIONS: UniverseSessionExitReason[] = [
  UniverseSessionExitReason.Crashed,
  UniverseSessionExitReason.Ended,
  UniverseSessionExitReason.Active,
];

const EMPTY_SELECTED_OPTIONS: UniverseSessionExitReason[] = [];

export type ClientSessionBrowserExitReasonFilterFieldsProps = {
  readonly label: FormattedText;
};

const ClientSessionBrowserExitReasonFilterFields: FC<
  ClientSessionBrowserExitReasonFilterFieldsProps
> = ({ label }) => {
  const statusLabels = useClientSessionStatusLabels();
  const { control } = useFormContext<SessionBrowserDrawerFilters>();
  const {
    field: { value: selectedValues, onChange },
  } = useController({ control, name: 'exitReasons' });

  const formatOption = useCallback(
    (exitReason: UniverseSessionExitReason) => statusLabels[exitReason],
    [statusLabels],
  );

  return (
    <ControlledFilterEnumChoice
      label={label}
      multiple
      selectedOptions={selectedValues ?? EMPTY_SELECTED_OPTIONS}
      options={EXIT_REASON_FILTER_OPTIONS}
      formatOption={formatOption}
      onChange={onChange}
    />
  );
};

export default ClientSessionBrowserExitReasonFilterFields;
