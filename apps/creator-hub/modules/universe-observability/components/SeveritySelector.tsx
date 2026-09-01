import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { Dropdown, Menu, MenuItem } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { LogSeverity } from '../types/LogSeverity';

export type SeveritySelectorProps = {
  readonly allowedSeverities: readonly LogSeverity[];
  readonly value: LogSeverity | undefined;
  readonly onChange: (value: LogSeverity | undefined) => void;
  readonly label?: string;
};

const ALL_SEVERITIES_VALUE = 'all';

const SeveritySelector: FC<SeveritySelectorProps> = ({
  allowedSeverities,
  value,
  onChange,
  label,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const resolvedLabel =
    label ??
    tPendingTranslation(
      'Severity',
      'Label for the log severity filter.',
      translationKey('ServerDetailsPage.Logs.SeverityLabel', TranslationNamespace.ServerManagement),
    );
  const allSeveritiesLabel = tPendingTranslation(
    'All',
    'Option to include logs of all severities.',
    translationKey('ServerDetailsPage.Logs.Severity.All', TranslationNamespace.ServerManagement),
  );
  const severityLabels = useMemo(
    () => ({
      [LogSeverity.Output]: tPendingTranslation(
        'Output',
        'Output severity option in the log severity filter.',
        translationKey(
          'ServerDetailsPage.Logs.Severity.Output',
          TranslationNamespace.ServerManagement,
        ),
      ),
      [LogSeverity.Info]: tPendingTranslation(
        'Info',
        'Informational severity option in the log severity filter.',
        translationKey(
          'ServerDetailsPage.Logs.Severity.Info',
          TranslationNamespace.ServerManagement,
        ),
      ),
      [LogSeverity.Warning]: tPendingTranslation(
        'Warning',
        'Warning severity option in the log severity filter.',
        translationKey(
          'ServerDetailsPage.Logs.Severity.Warning',
          TranslationNamespace.ServerManagement,
        ),
      ),
      [LogSeverity.Error]: tPendingTranslation(
        'Error',
        'Error severity option in the log severity filter.',
        translationKey(
          'ServerDetailsPage.Logs.Severity.Error',
          TranslationNamespace.ServerManagement,
        ),
      ),
    }),
    [tPendingTranslation],
  );
  const allowedSeverityByValue = useMemo(
    () =>
      new Map<string, LogSeverity>(
        allowedSeverities.map((severity) => [String(severity), severity]),
      ),
    [allowedSeverities],
  );
  const handleValueChange = useCallback(
    (nextValue: string) => {
      if (nextValue === ALL_SEVERITIES_VALUE) {
        onChange(undefined);
        return;
      }

      const severity = allowedSeverityByValue.get(nextValue);
      if (severity !== undefined) {
        onChange(severity);
      }
    },
    [allowedSeverityByValue, onChange],
  );

  return (
    <Dropdown
      className='min-width-[220px]'
      label={resolvedLabel}
      size='Medium'
      placeholder={allSeveritiesLabel}
      value={value === undefined ? ALL_SEVERITIES_VALUE : String(value)}
      onValueChange={handleValueChange}>
      <Menu>
        <MenuItem value={ALL_SEVERITIES_VALUE} title={allSeveritiesLabel} />
        {allowedSeverities.map((severity) => (
          <MenuItem key={severity} value={String(severity)} title={severityLabels[severity]} />
        ))}
      </Menu>
    </Dropdown>
  );
};

export default withNamespaceSwitchedTranslation(SeveritySelector, [
  TranslationNamespace.ServerManagement,
]);
