import type { FunctionComponent } from 'react';
import { useCallback } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { makeStyles, Checkbox, FormControlLabel } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import DataSharingDefaultSettingsKey from '../enums/DataSharingDefaultSettingsKey';
import DataSharingTabKey from '../enums/DataSharingTabKey';

const useStyles = makeStyles()({
  header: {
    marginBottom: 4,
    marginTop: 4,
  },
});

export type DefaultTabSettings = {
  [key in DataSharingDefaultSettingsKey]: boolean;
};

interface SettingsTabConfigProps {
  defaultTabSettings: DefaultTabSettings;
  currentTabKey: DataSharingTabKey;
}

const SettingsTabConfig: FunctionComponent<SettingsTabConfigProps> = ({
  defaultTabSettings,
  currentTabKey,
}) => {
  const {
    classes: { header },
  } = useStyles();

  const { translate } = useTranslation();

  const { control } = useFormContext();

  const renderCheckbox = useCallback(
    (name: DataSharingDefaultSettingsKey, label: string) => (
      <FormControlLabel
        control={
          <Controller
            name={name}
            control={control}
            defaultValue={defaultTabSettings[name]}
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                color='secondary'
                onChange={field.onChange}
                aria-label={label}
                data-testid={`checkbox-${name}`}
              />
            )}
          />
        }
        label={translate(label)}
        data-testid={`label-${name}`}
      />
    ),
    [control, defaultTabSettings, translate],
  );

  return (
    <Flex classes={{ root: header }} alignItems='flex-start' flexDirection='row'>
      {currentTabKey === DataSharingTabKey.ExperienceSettings &&
        renderCheckbox(DataSharingDefaultSettingsKey.Experiences, 'Label.ExperiencePreference')}
      {currentTabKey === DataSharingTabKey.AvatarItems &&
        renderCheckbox(DataSharingDefaultSettingsKey.AvatarItems, 'Label.BundlePreference')}
      {currentTabKey === DataSharingTabKey.CreatorStoreAssets &&
        renderCheckbox(DataSharingDefaultSettingsKey.CreatorStore, 'Label.ProductPreference')}
    </Flex>
  );
};

export default withTranslation(SettingsTabConfig, [TranslationNamespace.DataSharingSettingsV2]);
