import { useMemo, useCallback, Fragment, useRef, useEffect, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Table,
  TableCell,
  TableRow,
  TableHead,
  Grid,
  Typography,
  makeStyles,
  Tooltip,
  InfoOutlinedIcon,
  WarningIcon,
  Chip,
  CircularProgress,
  TableContainer,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useCreationsCustomSettings } from '@modules/creations/common/implementations/creationsCustomSettings';
import DefaultConfigurationSignals from '@modules/matchmaking/enums/DefaultConfigurationSignals';
import type { PlaceInfo } from '@modules/matchmaking/types/PlaceInfo';
import {
  getDefaultSignalsWeightsMap,
  getConfigurationDetailedInfo,
} from '@modules/matchmaking/utils/ConfigurationUtils';
import { defaultSignalsTranslationKeys } from '@modules/matchmaking/utils/translationGetter';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getRecordEntries } from '@modules/miscellaneous/utils/helperUtils';
import { ExperimentProductType } from '../../api/universeExperimentationClientEnums';
import useVariantsConfigurationProvider from '../context/VariantsConfigurationContext';
import type {
  ConfigurationStepFormDataMatchmaking,
  PlaceScoringConfig,
  VariantFormDataMatchmaking,
} from '../types/FormData';

const useStyles = makeStyles()(() => ({
  tableContainer: {
    width: 'fit-content',
    maxWidth: '100%',
    overflowX: 'auto',
  },
  chipImage: {
    width: 24,
    height: 24,
    borderRadius: '9px',
    position: 'relative',
    objectFit: 'contain',
  },
  variantTableCellContentItem: {
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
  },
  configTableCellContentItem: {
    paddingLeft: '16px',
    paddingRight: '16px',
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
  },
  chip: {
    width: 'fit-content',
    margin: 4,
    '& .MuiChip-label': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      display: 'block',
    },
  },
  configName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
  },
  configTableCell: {},
  variantCell: {
    width: 'fit-content',
    whiteSpace: 'nowrap',
  },
}));

// Union type for both form and valid config types
type placeConfigEntry = {
  placeScoringConfig: PlaceScoringConfig;
  isBaseline: boolean;
};

// Type for tooltip configuration entries (signal name and weight)
type ConfigSignalEntry = [string, number];

const MatchmakingVariantsTable = ({
  matchmakingVariants,
}: {
  matchmakingVariants: ConfigurationStepFormDataMatchmaking['matchmakingVariants'];
}) => {
  const {
    classes: {
      tableContainer,
      chip,
      chipImage,
      variantTableCellContentItem,
      configTableCellContentItem,
      configTableCell,
      variantCell,
      configName,
    },
  } = useStyles();
  const { translate } = useTranslationWrapper(useTranslation());
  const { getConfigs } = useVariantsConfigurationProvider(ExperimentProductType.Matchmaking);
  const { isCustomMatchmakingTextChatSignalEnabled } = useCreationsCustomSettings();

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [variantCellElement, setVariantCellElement] = useState<HTMLTableCellElement | null>(null);
  const [chipMaxWidth, setChipMaxWidth] = useState<number>(200);

  // Callback ref to capture when variant cell is attached
  const variantCellRef = useCallback((node: HTMLTableCellElement | null) => {
    if (node !== null) {
      setVariantCellElement(node);
    }
  }, []);

  const {
    configs: {
      placesInfoToSelect,
      allScoringConfigs,
      defaultSignalWeights,
      placeInfoToConfigMap,
      isPlacesLoading,
      isLoadingPlacesWithConfigurations,
      isLoadingConfigurationsForUniverse,
    },
    isPlaceCurrentConfigIdMismatchApplied,
  } = useMemo(() => getConfigs(), [getConfigs]);

  const isConfigurationsDependenciesLoading = useMemo(() => {
    return (
      isLoadingPlacesWithConfigurations || isLoadingConfigurationsForUniverse || isPlacesLoading
    );
  }, [isLoadingPlacesWithConfigurations, isLoadingConfigurationsForUniverse, isPlacesLoading]);

  // Source string: Roblox Default
  const RobloxDefaultScoringConfigName = translate(
    translationKey(
      'Label.ExperimentCreation.RobloxDefaultScoringConfig',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  // Build weight keys translation string map for using the default signals translation keys map
  const signalKeysTranslationMap = useMemo(() => {
    const translationMap = new Map<string, string>();
    getRecordEntries(defaultSignalsTranslationKeys).forEach(([signal, translationKeyForSignal]) => {
      const translatedSignal = translate(
        translationKey(translationKeyForSignal, TranslationNamespace.Matchmaking),
      );
      translationMap.set(signal, translatedSignal);
    });
    return translationMap;
  }, [translate]);

  const renderPlace = useCallback(
    (place: PlaceInfo | undefined) => {
      if (!place) {
        return null;
      }
      const placeName = place?.name ?? '';
      return (
        <Tooltip title={placeName} placement='top' arrow={false}>
          <Chip
            color='secondary'
            className={chip}
            icon={<img className={chipImage} src={place?.thumbnailUrl} alt={placeName} />}
            label={placeName}
            sx={{ maxWidth: `${chipMaxWidth}px` }}
          />
        </Tooltip>
      );
    },
    [chipImage, chip, chipMaxWidth],
  );

  const renderScoringConfig = useCallback(
    (placeConfig: placeConfigEntry, isBaseline: boolean) => {
      const { placeScoringConfig } = placeConfig;
      if (!placeScoringConfig) {
        return null;
      }
      let scoringConfigName = '';
      let customSignalEntries: ConfigSignalEntry[] = [];
      let signalEntries: ConfigSignalEntry[] = [];

      if (placeScoringConfig.usePlatformDefault) {
        scoringConfigName = RobloxDefaultScoringConfigName;
        // directly use the default signal weights object for this case
        const signalWeightsMap = getDefaultSignalsWeightsMap(defaultSignalWeights);

        signalEntries = Array.from(signalWeightsMap.entries())
          // TODO: (@mguo, @yqiu) Remove this once text chat signal is enabled for all universes
          .filter(([signal]) => {
            if (
              !isCustomMatchmakingTextChatSignalEnabled &&
              signal === DefaultConfigurationSignals.TextChat
            ) {
              return false;
            }
            return signal in defaultSignalsTranslationKeys;
          })
          .map(([signal, weight]) => {
            const translatedSignal = signalKeysTranslationMap.get(signal) ?? signal;
            return [translatedSignal, weight];
          });
      } else {
        // Handle both form and valid config types using helper function
        const configId = placeScoringConfig.matchmakingScoringConfigId;
        const scoringConfig = allScoringConfigs.find((c) => c.id === configId);

        // this step will parse the scoring config to set default signals keys weights in defaultSignals
        // and custom signals keys weights in customSignals
        const configDetails = getConfigurationDetailedInfo(scoringConfig, placeInfoToConfigMap);
        scoringConfigName = configDetails?.name ?? '';

        // Build signal entries from the parsed config details
        if (configDetails?.defaultSignals) {
          const { defaultSignals } = configDetails;
          const signalWeightsMap = getDefaultSignalsWeightsMap(defaultSignals);
          signalEntries = Array.from(signalWeightsMap.entries())
            // TODO: (@mguo, @yqiu) Remove this once text chat signal is enabled for all universes
            .filter(([signal]) => {
              if (
                !isCustomMatchmakingTextChatSignalEnabled &&
                signal === DefaultConfigurationSignals.TextChat
              ) {
                return false;
              }
              return signal in defaultSignalsTranslationKeys;
            })
            .map(([signal, weight]) => {
              const translatedSignal = signalKeysTranslationMap.get(signal) ?? signal;
              return [translatedSignal, weight];
            });
        }

        // Use the parsed custom signals
        if (configDetails?.customSignals) {
          customSignalEntries = configDetails.customSignals.map((signal) => [
            signal.name,
            signal.weight ?? 0,
          ]);
        }
      }

      // Check if this is a baseline variant and if the config is stale
      const isControlDifferentConfigApplied =
        isBaseline && isPlaceCurrentConfigIdMismatchApplied(placeScoringConfig);

      return (
        <Grid container direction='row' justifyContent='flex-start' alignItems='center'>
          {scoringConfigName ? (
            <>
              <Tooltip title={scoringConfigName} placement='top' arrow={false}>
                <Typography
                  variant='body2'
                  className={configName}
                  sx={{ maxWidth: `${chipMaxWidth - 32}px` }}>
                  {scoringConfigName}
                </Typography>
              </Tooltip>
              {isControlDifferentConfigApplied ? (
                <Tooltip
                  title={translate(
                    translationKey(
                      'Message.ExperimentCreation.ControlDifferentConfigApplied',
                      TranslationNamespace.UniverseConfigAndExperimentation,
                    ),
                  )}
                  placement='right'
                  arrow>
                  <WarningIcon fontSize='medium' color='warning' style={{ marginLeft: 4 }} />
                </Tooltip>
              ) : (
                <Tooltip
                  placement='right-end'
                  arrow={false}
                  title={
                    <Grid container direction='column' justifyContent='flex-start'>
                      <Grid item>
                        <Typography variant='captionHeader'>
                          {translate(
                            translationKey('Label.Weights', TranslationNamespace.Matchmaking),
                          )}
                        </Typography>
                      </Grid>
                      <Grid item>
                        <Typography color='disabled' variant='tooltip'>
                          {signalEntries
                            .map(([signal, weight]) => `${signal}: ${weight}`)
                            .join(', ')}
                        </Typography>
                      </Grid>
                      {customSignalEntries.length > 0 && (
                        <Grid item>
                          <Typography color='disabled' variant='tooltip'>
                            {customSignalEntries
                              .map(([signalName, weight]) => `${signalName}: ${weight}`)
                              .join(', ')}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  }>
                  <InfoOutlinedIcon fontSize='medium' color='secondary' style={{ marginLeft: 4 }} />
                </Tooltip>
              )}
            </>
          ) : (
            <>
              <Typography variant='body2'>N/A</Typography>
              <Tooltip
                title={translate(
                  translationKey(
                    'Message.ExperimentCreation.ConfigDeleted',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                )}
                placement='right'
                arrow>
                <InfoOutlinedIcon fontSize='medium' color='error' style={{ marginLeft: 4 }} />
              </Tooltip>
            </>
          )}
        </Grid>
      );
    },
    [
      defaultSignalWeights,
      translate,
      RobloxDefaultScoringConfigName,
      allScoringConfigs,
      isPlaceCurrentConfigIdMismatchApplied,
      configName,
      chipMaxWidth,
      signalKeysTranslationMap,
      placeInfoToConfigMap,
      // TODO: (@mguo, @yqiu) Remove this once text chat signal is enabled for all universes
      isCustomMatchmakingTextChatSignalEnabled,
    ],
  );

  // Use control arm to simply extract places
  const places = useMemo(() => {
    const baselineVariant = matchmakingVariants.find((variant) => variant.isBaseline);
    if (!baselineVariant) {
      return [];
    }

    const placeScoringConfigs = baselineVariant.placeScoringConfigs || [];
    return placeScoringConfigs
      .map((config) => {
        const placeId = Number(config.placeId);
        return placesInfoToSelect.find((place) => place.placeId === placeId);
      })
      .filter((place): place is PlaceInfo => place !== undefined);
  }, [matchmakingVariants, placesInfoToSelect]);

  // Helper to get config for a specific variant and place
  const getConfigForVariantAndPlace = useCallback(
    (variant: VariantFormDataMatchmaking, placeId: number): placeConfigEntry | undefined => {
      const config = variant.placeScoringConfigs?.find((c) => Number(c.placeId) === placeId);
      if (!config) {
        return undefined;
      }
      return {
        placeScoringConfig: config,
        isBaseline: variant.isBaseline,
      };
    },
    [],
  );

  // Calculate and set chip max-width dynamically
  useEffect(() => {
    const container = tableContainerRef.current;
    const parentElement = container?.parentElement;

    if (!container || !parentElement || !variantCellElement || places.length === 0) {
      return;
    }

    const calculateChipMaxWidth = () => {
      const parentWidth = parentElement.clientWidth || 0;
      if (parentWidth === 0) {
        return;
      }

      // Get actual variant column width from DOM
      const variantColumnWidth = variantCellElement.clientWidth || 150;
      // Account for table padding and margins
      const totalColumns = 1 + places.length;
      const cellPadding = 16 * totalColumns; // Cell padding per column
      const tablePadding = 32;
      const chipPadding = 8 * places.length;
      // Available width for place columns
      const availableWidth =
        parentWidth - variantColumnWidth - cellPadding - tablePadding - chipPadding;
      // Divide equally among place columns
      const calculatedWidth = Math.floor(availableWidth / places.length);

      // Update state with calculated width
      setChipMaxWidth(calculatedWidth);
    };

    // Calculate immediately
    calculateChipMaxWidth();

    // Recalculate on resize
    const resizeObserver = new ResizeObserver(calculateChipMaxWidth);
    resizeObserver.observe(parentElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [variantCellElement, places.length]);

  // Handle loading states
  if (isConfigurationsDependenciesLoading) {
    return <CircularProgress color='secondary' />;
  }

  return (
    <TableContainer ref={tableContainerRef} className={tableContainer}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell className={variantCell}>
              <Typography variant='body1'>
                {/* Label source string: Variant */}
                {translate(
                  translationKey(
                    'Label.ExperimentCreation.Variant',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                )}
              </Typography>
            </TableCell>
            {places.map((place) => (
              <TableCell key={place.placeId}>{renderPlace(place)}</TableCell>
            ))}
          </TableRow>
        </TableHead>

        {matchmakingVariants.map((variant, index) => (
          // eslint-disable-next-line react/no-array-index-key -- variant order is stable in display table
          <TableRow key={index}>
            <TableCell className={variantCell} ref={index === 0 ? variantCellRef : undefined}>
              <div className={variantTableCellContentItem}>
                <Typography variant='body2'>{variant.label}</Typography>
              </div>
            </TableCell>
            {places.map((place) => {
              const placeId = place.placeId ?? 0;
              const config = getConfigForVariantAndPlace(variant, placeId);
              return (
                <TableCell key={placeId} className={configTableCell}>
                  <div className={configTableCellContentItem}>
                    {config ? renderScoringConfig(config, variant.isBaseline) : null}
                  </div>
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </Table>
    </TableContainer>
  );
};

export default withTranslation(MatchmakingVariantsTable, [
  TranslationNamespace.Matchmaking,
  TranslationNamespace.UniverseConfigAndExperimentation,
]);
