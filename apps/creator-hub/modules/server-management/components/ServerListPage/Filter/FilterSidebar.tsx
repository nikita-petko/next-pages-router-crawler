import React, { FunctionComponent, useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { ButtonGroup, Grid, Typography } from '@rbx/ui';
import {
  Button,
  Divider,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetRoot,
  SheetTitle,
  SystemBanner,
} from '@rbx/foundation-ui';
import { GameServerFilters } from '../../../types/GameServerControls';
import { isFilterRestartViable } from '../../../utils/FilterUtils';
import useFilterSidebarStyles from './FilterSidebar.styles';
import DropdownSection from './filters/DropdownSection';
import ServerTypeSection from './filters/ServerTypeSection';
import NumberRangeSection from './filters/NumberRangeSection';

export type RangeBounds = {
  frameRate: { min: number; max: number };
  memoryUsed: { min: number; max: number };
  occupancy: { min: number; max: number };
};

export interface SidebarProps {
  onOpenChange: (open: boolean) => void;
  setFilters: (filters: GameServerFilters) => void;
  open?: boolean;
  placeName?: string;
  existingFilters?: GameServerFilters;
  validPlaceVersions?: string[];
  validEngineVersions?: string[];
  rangeBounds?: RangeBounds;
}

export const defaultFilters: GameServerFilters = {
  placeVersion: [],
  engineVersion: [],
  serverType: {
    public: true,
    reserved: true,
    vip: true,
  },
  serverStatus: {
    active: true,
    terminated: true,
  },
  frameRate: { min: undefined, max: undefined },
  memoryUsed: { min: undefined, max: undefined },
  occupancy: { min: undefined, max: undefined },
};

const defaultBounds: RangeBounds = {
  frameRate: { min: 0, max: 60 },
  memoryUsed: { min: 0, max: 8000 },
  occupancy: { min: 0, max: 200 },
};

const defaultPlaceVersions = ['1', '2', '3', '4', '5', '6'];
const defaultEngineVersions = ['710', '711', '712', '713', '714', '715'];

const FilterSidebar: FunctionComponent<SidebarProps> = ({
  onOpenChange,
  setFilters,
  open: sidebarOpen,
  placeName,
  existingFilters,
  validPlaceVersions,
  validEngineVersions,
  rangeBounds = defaultBounds,
}) => {
  const { translate } = useTranslation();
  const { classes } = useFilterSidebarStyles();

  const { description, descriptionContainer, filterBody, filterActions } = classes;

  const [draftFilters, setDraftFilters] = useState<GameServerFilters>(
    existingFilters ?? defaultFilters,
  );
  const [invalidInputs, setInvalidInputs] = useState<boolean[]>([]);

  const setInvalidInput = useCallback(
    (index: number) => {
      return (error: boolean) => {
        setInvalidInputs((prev) => {
          const newInvalidInputs = [...prev];
          newInvalidInputs[index] = error;
          return newInvalidInputs;
        });
      };
    },
    [setInvalidInputs],
  );

  const setFilterField = useCallback(
    <K extends keyof GameServerFilters>(key: K) =>
      (value: GameServerFilters[K]) => {
        setDraftFilters((prev) => ({ ...prev, [key]: value }));
      },
    [],
  );

  // Give NumberRangeSections stable references
  const setFrameRate = useMemo(() => setFilterField('frameRate'), [setFilterField]);
  const setMemoryUsed = useMemo(() => setFilterField('memoryUsed'), [setFilterField]);
  const setOccupancy = useMemo(() => setFilterField('occupancy'), [setFilterField]);

  const invalidFrameRate = useMemo(() => setInvalidInput(1), [setInvalidInput]);
  const invalidMemoryUsed = useMemo(() => setInvalidInput(2), [setInvalidInput]);
  const invalidOccupancy = useMemo(() => setInvalidInput(3), [setInvalidInput]);

  const resetFilters = useCallback(() => {
    setDraftFilters(defaultFilters);
    setFilters(defaultFilters);
    setInvalidInputs([]);
  }, [setDraftFilters, setFilters]);

  const toggleSidebar = useCallback(
    (open: boolean) => {
      if (!open) {
        setDraftFilters(existingFilters ?? defaultFilters);
        setInvalidInputs([]);
      }
      onOpenChange(open);
    },
    [existingFilters, onOpenChange],
  );

  const onApply = useCallback(() => {
    setFilters(draftFilters);
    onOpenChange(false);
  }, [setFilters, draftFilters, onOpenChange]);

  // Make sure that draft filters keep up with existingFilters if changed outside
  useEffect(() => {
    if (existingFilters) {
      setDraftFilters(existingFilters);
    }
  }, [existingFilters]);

  return (
    <SheetRoot onOpenChange={toggleSidebar} open={sidebarOpen}>
      <SheetContent largeScreenVariant='side'>
        <SheetTitle>{translate('Heading.ServerListTable.Filter')}</SheetTitle>
        <Grid container direction='column' className={descriptionContainer}>
          <SheetDescription>
            <Grid container direction='row' className={description}>
              <Grid item container direction='column'>
                <Typography variant='h6'>
                  {translate('ServerListTable.Filter.PlacePrefix')}
                </Typography>
                <Typography>{placeName}</Typography>
              </Grid>
              <Grid item>
                <Button variant='Standard' size='Small' onClick={resetFilters}>
                  {translate('ServerListTable.Filter.Button.ResetFilters')}
                </Button>
              </Grid>
            </Grid>
          </SheetDescription>
          <Divider />
        </Grid>
        <SheetBody className={filterBody}>
          <DropdownSection
            label={translate('ServerListTable.Filter.PlaceVersion')}
            options={validPlaceVersions ?? defaultPlaceVersions}
            displayFormatter={(option) => `v${option}`}
            setValue={setFilterField('placeVersion')}
            currentValue={draftFilters.placeVersion}
          />
          <Divider />
          <DropdownSection
            label={translate('ServerListTable.Filter.EngineVersion')}
            options={validEngineVersions ?? defaultEngineVersions}
            setValue={setFilterField('engineVersion')}
            currentValue={draftFilters.engineVersion}
          />
          <ServerTypeSection
            setServerType={setFilterField('serverType')}
            currentType={draftFilters.serverType}
          />
          <Divider />
          <NumberRangeSection
            label={translate('ServerListTable.Filter.FrameRate')}
            setRange={setFrameRate}
            currentRange={draftFilters.frameRate}
            isInvalid={invalidFrameRate}
            placeholderBounds={rangeBounds.frameRate}
            integerOnly
          />
          <Divider />
          <NumberRangeSection
            label={translate('ServerListTable.Filter.MemoryUsed')}
            setRange={setMemoryUsed}
            currentRange={draftFilters.memoryUsed}
            isInvalid={invalidMemoryUsed}
            placeholderBounds={rangeBounds.memoryUsed}
          />
          <Divider />
          <NumberRangeSection
            label={translate('ServerListTable.Filter.Occupancy')}
            setRange={setOccupancy}
            currentRange={draftFilters.occupancy}
            isInvalid={invalidOccupancy}
            placeholderBounds={rangeBounds.occupancy}
            integerOnly
          />
        </SheetBody>
        <SheetActions>
          {!isFilterRestartViable(draftFilters, validPlaceVersions) && (
            <SystemBanner
              severity='Warning'
              showIcon
              title=''
              description={translate('ServerListTable.Filter.RestartRestrction.Tooltip')}
              variant='Standard'
              className='margin-bottom-small'
            />
          )}
          <ButtonGroup fullWidth className={filterActions}>
            <Button variant='Emphasis' onClick={onApply} isDisabled={invalidInputs.includes(true)}>
              {translate('ServerListTable.Filter.Button.Apply')}
            </Button>
            <Button variant='Standard' onClick={() => toggleSidebar(false)}>
              {translate('ServerListTable.Filter.Button.Cancel')}
            </Button>
          </ButtonGroup>
        </SheetActions>
      </SheetContent>
    </SheetRoot>
  );
};

export default FilterSidebar;
