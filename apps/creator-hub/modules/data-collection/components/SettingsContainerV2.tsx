import type { FunctionComponent } from 'react';
import { Fragment, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useForm, useWatch, FormProvider } from 'react-hook-form';
import { PreferenceType } from '@rbx/client-resource-settings-api/v1';
import { HubMeta, buildTitle } from '@rbx/creator-hub-history';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, CircularProgress, Alert, useSnackbar, IconButton, CloseIcon } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/components';
import Flex from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  useGetDataSharingPreferences,
  useSetDataSharingPreferences,
} from '@modules/react-query/resourceSettings';
import DataSharingDefaultSettingsKey from '../enums/DataSharingDefaultSettingsKey';
import DataSharingTabKey from '../enums/DataSharingTabKey';
import useTabQueryParam from '../hooks/useTabQueryParam';
import {
  setAssetConfigurations,
  setAvatarAssetConfigurations,
  setBundleConfigurations,
  setUniverseConfigurations,
} from '../utils/apiUtils';
import {
  getChangedData,
  getDefaultPreferencesFromForm,
  toDataSharingDefaultSettingsKey,
  parseFormDataToConfigurations,
} from '../utils/formDiffUtils';
import type { TabConfig } from './DataSharingTabs';
import DataSharingTabs from './DataSharingTabs';
import DataSharingTitle from './DataSharingTitle';
import SettingsFooter from './SettingsFooter';
import type { DefaultTabSettings } from './SettingsTabConfig';
import SettingsTabConfig from './SettingsTabConfig';
import type { EntityTableColumnConfig } from './SettingsTableConfig';
import {
  SettingsExperiencesTableColumnConfigs,
  SettingsAssetTableColumnConfigs,
  SettingsAvatarTableColumnConfigs,
} from './SettingsTableConfig';
import SettingsV2 from './SettingsV2';

const DataSharingTabConfigs: Array<TabConfig> = [
  { label: 'Tab.Bundles', key: DataSharingTabKey.AvatarItems },
  { label: 'Tab.Products', key: DataSharingTabKey.CreatorStoreAssets },
  { label: 'Tab.Experiences', key: DataSharingTabKey.ExperienceSettings },
  { label: 'Tab.PublicLuau', key: DataSharingTabKey.LuauDataset },
];

interface FormData {
  [key: string]: boolean;
}

const SettingsContainerV2: FunctionComponent = () => {
  const [currentTab, setTab] = useTabQueryParam();
  const methods = useForm();
  const { handleSubmit, formState, reset } = methods;
  const formData = useWatch({ control: methods.control });
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [defaultTabSettings, setDefaultTabSettings] = useState<DefaultTabSettings>({
    [DataSharingDefaultSettingsKey.Experiences]: false,
    [DataSharingDefaultSettingsKey.AvatarItems]: false,
    [DataSharingDefaultSettingsKey.CreatorStore]: false,
  });
  const [resetKey, setResetKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data,
    isPending: areDefaultSettingsLoading,
    isError: didDefaultSettingsLoadFail,
  } = useGetDataSharingPreferences([
    PreferenceType.Universes,
    PreferenceType.AvatarBundles,
    PreferenceType.CreatorStoreAssets,
  ]);
  const { mutateAsync: updatePreferences } = useSetDataSharingPreferences();
  const { enqueue, close } = useSnackbar();
  const { translate } = useTranslation();

  const initialValuesRef = useRef({});
  const setInitialValues = useCallback((initialValues: FormData) => {
    initialValuesRef.current = initialValues;
  }, []);

  useEffect(() => {
    if (!didDefaultSettingsLoadFail) {
      return;
    }
    enqueue({
      children: (
        <Alert
          severity='error'
          variant='filled'
          action={
            <IconButton aria-label='close' onClick={close} color='inherit' size='small'>
              <CloseIcon />
            </IconButton>
          }>
          {translate('Messsage.LoadError')}
        </Alert>
      ),
    });
  }, [didDefaultSettingsLoadFail, enqueue, close, translate]);

  useEffect(() => {
    if (data === undefined) {
      return;
    }
    const { configurations, isEligible } = data;

    if (isEligible) {
      const newSettings: DefaultTabSettings = configurations.reduce((acc, config) => {
        const isDataSharingEnabledKey = toDataSharingDefaultSettingsKey(config.type);
        acc[isDataSharingEnabledKey] = !config.isOptOut;
        return acc;
      }, {} as DefaultTabSettings);

      setDefaultTabSettings(newSettings);
      methods.reset(newSettings);
    }
  }, [data, methods]);

  const checkNetChanges = useCallback(
    (currentData: FormData) => {
      const changedDataSharingValues = getChangedData(initialValuesRef.current, currentData);

      const tabSettingsChanged = Object.entries(defaultTabSettings).some(
        ([key, value]) => value !== currentData[key],
      );

      return tabSettingsChanged || Object.keys(changedDataSharingValues).length > 0;
    },
    [defaultTabSettings],
  );

  useEffect(() => {
    const hasNetChanges = checkNetChanges(formData);
    setIsSubmitEnabled(hasNetChanges);
  }, [checkNetChanges, formData, formState.isDirty]);

  const resetFormStateOnSubmission = useCallback(
    (formDataSubmitted: FormData) => {
      initialValuesRef.current = formDataSubmitted;

      const defaultSettings = Object.values(DataSharingDefaultSettingsKey);
      const defaultSettingsFromForm = defaultSettings.reduce(
        (acc, key) => ({ ...acc, [key]: !!formDataSubmitted[key] }),
        {} as DefaultTabSettings,
      );
      setDefaultTabSettings(defaultSettingsFromForm);

      methods.reset(formDataSubmitted);
    },
    [methods],
  );

  const onSubmit = useCallback(
    async (formDataSubmitted: FormData) => {
      const tabSettingsChanged = Object.entries(defaultTabSettings).some(
        ([key, value]) => value !== formDataSubmitted[key],
      );

      const initialValues: FormData = initialValuesRef.current;

      const {
        universeConfigurations,
        avatarAssetConfigurations,
        avatarBundleConfigurations,
        assetConfigurations,
      } = parseFormDataToConfigurations(initialValues, formDataSubmitted);

      if (
        tabSettingsChanged ||
        Object.keys(universeConfigurations).length > 0 ||
        Object.keys(avatarAssetConfigurations).length > 0 ||
        Object.keys(avatarBundleConfigurations).length > 0 ||
        Object.keys(assetConfigurations).length > 0
      ) {
        const currentDefaultPreferences = getDefaultPreferencesFromForm(formDataSubmitted);
        setIsSubmitting(true);
        try {
          await Promise.all([
            updatePreferences(currentDefaultPreferences),
            setUniverseConfigurations(universeConfigurations),
            setAvatarAssetConfigurations(avatarAssetConfigurations),
            setBundleConfigurations(avatarBundleConfigurations),
            setAssetConfigurations(assetConfigurations),
          ]);
          resetFormStateOnSubmission(formDataSubmitted);
        } catch {
          enqueue({
            children: (
              <Alert
                severity='error'
                variant='filled'
                action={
                  <IconButton aria-label='close' onClick={close} color='inherit' size='small'>
                    <CloseIcon />
                  </IconButton>
                }>
                {translate('Message.DataSharingError')}
              </Alert>
            ),
          });
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [defaultTabSettings, updatePreferences, resetFormStateOnSubmission, enqueue, close, translate],
  );

  const handleCancel = () => {
    const initialForm = { ...defaultTabSettings, ...initialValuesRef.current };
    reset(initialForm);
    setResetKey((prevKey) => prevKey + 1);
  };

  const columnHeaders = useMemo(() => {
    switch (currentTab) {
      case DataSharingTabKey.ExperienceSettings:
        return Object.values(SettingsExperiencesTableColumnConfigs) as EntityTableColumnConfig[];
      case DataSharingTabKey.AvatarItems:
        return Object.values(SettingsAvatarTableColumnConfigs) as EntityTableColumnConfig[];
      case DataSharingTabKey.CreatorStoreAssets:
        return Object.values(SettingsAssetTableColumnConfigs) as EntityTableColumnConfig[];
      case DataSharingTabKey.LuauDataset:
        return Object.values(SettingsExperiencesTableColumnConfigs) as EntityTableColumnConfig[];
      default:
        return Object.values(SettingsAvatarTableColumnConfigs) as EntityTableColumnConfig[];
    }
  }, [currentTab]);

  if (areDefaultSettingsLoading) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  if (!data?.isEligible) {
    return (
      <>
        <DataSharingTitle />
        {data !== undefined && <Alert severity='warning'>{translate('Message.Ineligible')}</Alert>}
      </>
    );
  }

  const activeTabLabel = DataSharingTabConfigs.find(
    (t) => t.key === (currentTab ?? DataSharingTabConfigs[0].key),
  )?.label;

  return (
    <>
      <HubMeta
        title={
          activeTabLabel
            ? buildTitle(translate(activeTabLabel))
            : buildTitle(translate('Heading.DataSharing'))
        }
      />
      <DataSharingTitle />
      <Grid>
        <Grid item>
          <DataSharingTabs
            currentTabKey={currentTab ?? DataSharingTabConfigs[0].key}
            tabs={DataSharingTabConfigs}
            onTabChange={(newTabKey) => setTab(newTabKey)}
          />
        </Grid>
      </Grid>
      <FormProvider {...methods}>
        <Flex flexDirection='column'>
          <SettingsV2
            currentTab={currentTab ?? DataSharingTabConfigs[0].key}
            columnHeaders={columnHeaders}
            initialValuesRef={initialValuesRef}
            setInitialValues={setInitialValues}
            resetKey={resetKey}
          />
          <SettingsTabConfig
            defaultTabSettings={defaultTabSettings}
            currentTabKey={currentTab ?? DataSharingTabConfigs[0].key}
          />
          <SettingsFooter
            onSubmit={handleSubmit(onSubmit)}
            onCancel={handleCancel}
            isDirty={formState.isDirty && isSubmitEnabled}
            initialValuesRef={initialValuesRef}
            isSubmitting={isSubmitting}
          />
        </Flex>
      </FormProvider>
    </>
  );
};

export default withTranslation(SettingsContainerV2, [TranslationNamespace.DataSharingSettingsV2]);
