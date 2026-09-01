import { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { FormControlLabel, Switch, Tooltip } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  isLoading: boolean;
  isError: boolean;
}

const UniverseHostingPolicyToggle = ({ checked, onChange, isLoading, isError }: Props) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked),
    [onChange],
  );

  const ariaLabel = tPendingTranslation(
    'Player-hosted events',
    'Aria label for the player-hosted events toggle switch',
    translationKey('Label.PlayerHostedEventsAriaLabel', TranslationNamespace.Creations),
  );

  const toggleLabel = tPendingTranslation(
    'Allow player-hosted events',
    'Toggle label to enable or disable player-hosted events for a universe',
    translationKey('Label.AllowPlayerHostedEvents', TranslationNamespace.Creations),
  );

  const errorTooltip = tPendingTranslation(
    'Failed to load player-hosted events setting. Please refresh and try again.',
    'Error tooltip shown when the player-hosted events toggle fails to load',
    translationKey('Label.PlayerHostedEventsLoadError', TranslationNamespace.Creations),
  );

  return (
    <FormControlLabel
      className='width-fit'
      control={
        <Switch
          checked={isLoading ? undefined : checked}
          disabled={isLoading || isError}
          onChange={handleChange}
          aria-label={ariaLabel}
        />
      }
      label={
        <Tooltip title={isError ? errorTooltip : ''}>
          <span>{toggleLabel}</span>
        </Tooltip>
      }
    />
  );
};

export default UniverseHostingPolicyToggle;
