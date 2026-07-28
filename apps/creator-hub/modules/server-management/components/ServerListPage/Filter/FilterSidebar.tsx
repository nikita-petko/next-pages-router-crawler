import type { FunctionComponent } from 'react';
import { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
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
import { useTranslation } from '@rbx/intl';
import { ButtonGroup, Grid, Typography } from '@rbx/ui';
import type { GameServerFilters } from '../../../types/GameServerControls';
import { isFilterRestartViable } from '../../../utils/FilterUtils';
import {
  ACTIVE_ONLY_SERVER_STATUS_FILTER,
  areNoServerStatusesSelected,
} from '../../../utils/serverStatus';
import DropdownSection from './filters/DropdownSection';
import NumberRangeSection from './filters/NumberRangeSection';
import ServerStatusSection from './filters/ServerStatusSection';
import ServerTypeSection from './filters/ServerTypeSection';
import useFilterSidebarStyles from './FilterSidebar.styles';

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
  showShutdownServers?: boolean;
}

export const defaultFilters: GameServerFilters = {
  placeVersion: [],
  engineVersion: [],
  serverType: {
    public: true,
    reserved: true,
    vip: true,
    teamCreate: true,
    teamTest: true,
  },
  // active-only keeps list queries off the combined active+shutdown path
  serverStatus: {
    ...ACTIVE_ONLY_SERVER_STATUS_FILTER,
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
  showShutdownServers = false,
}) => {
  const { translate } = useTranslation();
  const { classes } = useFilterSidebarStyles();

  const { description, descriptionContainer, filterBody, filterActions } = classes;

  const [draftFilters, setDraftFilters] = useState<GameServerFilters>(
    existingFilters ?? defaultFilters,
  );
  const [invalidInputs, setInvalidInputs] = useState<boolean[]>([]);
  const [wasOpen, setWasOpen] = useState(Boolean(sidebarOpen));
  const pendingApplyRef = useRef<GameServerFilters | null>(null);
  const focusRestoreRef = useRef<HTMLElement | null>(null);
  const noServerStatusesSelected =
    showShutdownServers && areNoServerStatusesSelected(draftFilters.serverStatus);
  const noServerTypesSelected = Object.values(draftFilters.serverType).every((v) => !v);

  // hydrate draft when the sheet opens (render-time; keep focus capture in an effect)
  if (Boolean(sidebarOpen) !== wasOpen) {
    setWasOpen(Boolean(sidebarOpen));
    if (sidebarOpen) {
      setDraftFilters(existingFilters ?? defaultFilters);
      setInvalidInputs([]);
    }
  }

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

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }
    focusRestoreRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }, [sidebarOpen]);

  const commitPendingApply = useCallback(() => {
    const next = pendingApplyRef.current;
    if (!next) {
      return;
    }
    pendingApplyRef.current = null;
    setFilters(next);
  }, [setFilters]);

  const restoreFocusAfterClose = useCallback(() => {
    const el = focusRestoreRef.current;
    focusRestoreRef.current = null;
    // after apply commit + portal teardown so we don't refocus mid-exit (sheet flash)
    requestAnimationFrame(() => {
      el?.focus?.();
    });
  }, []);

  // jsdom may skip close-autofocus; commit once portal is gone
  useEffect(() => {
    if (sidebarOpen || !pendingApplyRef.current) {
      return undefined;
    }
    const tryCommit = () => {
      if (!pendingApplyRef.current) {
        return;
      }
      if (document.querySelector('[data-testid="fui-base-sheet-content"]')) {
        return;
      }
      commitPendingApply();
    };
    tryCommit();
    const observer = new MutationObserver(tryCommit);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [sidebarOpen, commitPendingApply]);

  const toggleSidebar = useCallback(
    (open: boolean) => {
      onOpenChange(open);
    },
    [onOpenChange],
  );

  const onApply = useCallback(() => {
    if (noServerStatusesSelected || noServerTypesSelected) {
      return;
    }
    pendingApplyRef.current = draftFilters;
    onOpenChange(false);
  }, [draftFilters, noServerStatusesSelected, noServerTypesSelected, onOpenChange]);

  return (
    <SheetRoot onOpenChange={toggleSidebar} open={sidebarOpen}>
      <SheetContent
        largeScreenVariant='side'
        onCloseAutoFocus={(event) => {
          // keep focus from jumping to the filter button mid-teardown
          event.preventDefault();
          commitPendingApply();
          restoreFocusAfterClose();
        }}>
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
          {showShutdownServers && (
            <>
              <Divider />
              <ServerStatusSection
                setServerStatus={setFilterField('serverStatus')}
                currentStatus={draftFilters.serverStatus}
              />
            </>
          )}
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
            <Button
              variant='Emphasis'
              onClick={onApply}
              isDisabled={
                invalidInputs.includes(true) || noServerStatusesSelected || noServerTypesSelected
              }>
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

// while closed, ignore parent filter/table prop churn so Radix exit animation isn't restarted
function areFilterSidebarPropsEqual(prev: SidebarProps, next: SidebarProps): boolean {
  if (Boolean(prev.open) !== Boolean(next.open)) {
    return false;
  }
  if (next.open) {
    return false;
  }
  return (
    prev.onOpenChange === next.onOpenChange &&
    prev.setFilters === next.setFilters &&
    prev.showShutdownServers === next.showShutdownServers
  );
}

export default memo(FilterSidebar, areFilterSidebarPropsEqual);
