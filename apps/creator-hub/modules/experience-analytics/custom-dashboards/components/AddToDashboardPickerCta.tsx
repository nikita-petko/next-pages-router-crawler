import { type ChangeEvent, type FC, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Divider,
  Snackbar,
  TextInput,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { customDashboardQueryKeys } from '../hooks/customDashboardsQueryConfig';
import { useDashboardsListQuery } from '../hooks/useDashboardsListQuery';
import {
  useCanMutateCustomDashboards,
  useCustomDashboardService,
} from '../service/CustomDashboardServiceProvider';
import CustomDashboardsShell from '../shell/CustomDashboardsShell';
import { EMPTY_DASHBOARD_CONFIG, type ChartTileConfig } from '../types';
import { addChartTileToConfig } from '../utils/addChartTileToConfig';
import { createTileId } from '../utils/createTileId';
import LocalCopyBadge from './LocalCopyBadge';

const SnackbarDismissMs = 8_000;
const dialogContentStyle = { width: 'min(92vw, 34rem)', maxWidth: 'min(92vw, 34rem)' };
/**
 * Caps the existing-dashboard list at ~15 Medium checkbox rows before scrolling.
 * Keep the max-height class as a static string so Tailwind JIT can emit it.
 * size-600 ≈ Medium checkbox control height; gap-medium matches row spacing.
 */
const dashboardListScrollClassName =
  'flex flex-col gap-medium scroll-y max-height-[calc((var(--size-600)+var(--gap-medium))*15-var(--gap-medium))]';

type AddToDashboardPickerCtaProps = {
  readonly universeId: number;
  readonly capturedTile: ChartTileConfig | null;
  readonly isDisabled?: boolean;
  readonly disabledReason?: string;
  readonly onNavigateToDashboard?: (href: string) => void;
};

type AddDashboardToast =
  | {
      readonly kind: 'pending' | 'error';
      readonly title: string;
    }
  | {
      readonly kind: 'success';
      readonly title: string;
      readonly href: string;
      readonly actionLabel: string;
    };

type AddedDashboardDestination = {
  readonly id: string;
  readonly name: string;
};

function getDashboardEditorHref(universeId: number, dashboardId: string): string {
  return `/dashboard/creations/experiences/${universeId}/analytics/dashboards/${dashboardId}/edit`;
}

function getDashboardsManageHref(universeId: number): string {
  return `/dashboard/creations/experiences/${universeId}/analytics/dashboards`;
}

function defaultNavigateToDashboard(href: string): void {
  window.location.href = href;
}

export const AddToDashboardPickerCtaInner: FC<AddToDashboardPickerCtaProps> = ({
  universeId,
  capturedTile,
  isDisabled = false,
  disabledReason,
  onNavigateToDashboard = defaultNavigateToDashboard,
}) => {
  const { tPendingTranslation, translate } = useTranslationWrapper(useTranslation());
  const service = useCustomDashboardService();
  const canMutateDashboards = useCanMutateCustomDashboards();
  const queryClient = useQueryClient();
  const { user } = useAuthentication();
  const listQuery = useDashboardsListQuery(universeId);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDashboardIds, setSelectedDashboardIds] = useState<readonly string[]>([]);
  const [createNewDashboard, setCreateNewDashboard] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [isSubmittingDestinationId, setIsSubmittingDestinationId] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<unknown>(null);
  const [toast, setToast] = useState<AddDashboardToast | null>(null);

  const addLabel = tPendingTranslation(
    'Add to dashboard',
    'Button label that opens the custom dashboards picker from Explore Mode.',
    translationKey('Action.AddToDashboard', TranslationNamespace.Analytics),
  );
  const submitAddLabel = tPendingTranslation(
    'Add',
    'Primary button label for adding the Explore Mode chart to selected dashboards.',
    translationKey('Action.ConfirmAddToDashboard', TranslationNamespace.Analytics),
  );
  const disabledLabel =
    disabledReason ??
    tPendingTranslation(
      'Pick a metric first',
      'Tooltip explaining why the add-to-dashboard picker cannot open yet.',
      translationKey('Description.AddToDashboardDisabled', TranslationNamespace.Analytics),
    );
  const dialogTitle = tPendingTranslation(
    'Add to dashboard',
    'Dialog title for choosing which custom dashboard should receive the current Explore Mode chart.',
    translationKey('Heading.AddChartToDashboard', TranslationNamespace.Analytics),
  );
  const dialogDescription = tPendingTranslation(
    'Select a dashboard to add this chart to',
    'Dialog description for the add-to-dashboard picker.',
    translationKey('Description.AddChartToDashboard', TranslationNamespace.Analytics),
  );
  const closeLabel = translate(translationKey('Action.Close', TranslationNamespace.Controls));
  const cancelLabel = translate(translationKey('Action.Cancel', TranslationNamespace.Controls));
  const newDashboardLabel = tPendingTranslation(
    'Create new dashboard',
    'Picker row label for creating a new custom dashboard with the captured chart.',
    translationKey('Action.AddToNewDashboard', TranslationNamespace.Analytics),
  );
  const newDashboardNamePlaceholder = tPendingTranslation(
    'Enter name',
    'Placeholder text for naming a new dashboard from the add-to-dashboard picker.',
    translationKey('Placeholder.NewDashboardNameFromPicker', TranslationNamespace.Analytics),
  );
  const loadingLabel = tPendingTranslation(
    'Loading dashboards...',
    'Status text while loading dashboards in the add-to-dashboard picker.',
    translationKey('Label.LoadingDashboardsForPicker', TranslationNamespace.Analytics),
  );
  const errorLabel = tPendingTranslation(
    "Couldn't load dashboards.",
    'Error text when the add-to-dashboard picker cannot load dashboards.',
    translationKey('Error.LoadDashboardsForPicker', TranslationNamespace.Analytics),
  );
  const emptyLabel = tPendingTranslation(
    'No dashboards yet.',
    'Empty state text when the picker only has the new-dashboard option.',
    translationKey('Label.NoDashboardsForPicker', TranslationNamespace.Analytics),
  );
  const addFailedLabel = tPendingTranslation(
    "Couldn't add this chart. Try again.",
    'Error text when adding an Explore Mode chart to a dashboard fails.',
    translationKey('Error.AddChartToDashboardFailed', TranslationNamespace.Analytics),
  );
  const addingLabel = tPendingTranslation(
    'Adding chart...',
    'Snackbar status while adding an Explore Mode chart to a custom dashboard.',
    translationKey('Label.AddingChartToDashboard', TranslationNamespace.Analytics),
  );
  const creatingDashboardLabel = tPendingTranslation(
    'Creating dashboard...',
    'Snackbar status while creating a custom dashboard from the Explore Mode add-to-dashboard picker.',
    translationKey('Label.CreatingDashboardFromPicker', TranslationNamespace.Analytics),
  );
  const openDashboardLabel = tPendingTranslation(
    'Open dashboard',
    'Snackbar action label after adding a chart to a dashboard without navigating.',
    translationKey('Action.OpenDashboardAfterAdd', TranslationNamespace.Analytics),
  );
  const openDashboardsLabel = tPendingTranslation(
    'Open dashboards',
    'Snackbar action label after adding a chart to multiple dashboards.',
    translationKey('Action.OpenDashboardsAfterAdd', TranslationNamespace.Analytics),
  );

  const serverDashboards = listQuery.data?.items ?? [];
  const dashboards = listQuery.data?.localItems
    ? [...listQuery.data.localItems, ...serverDashboards]
    : serverDashboards;
  const canSubmit = !!capturedTile && !!user && !isDisabled && canMutateDashboards;
  const trimmedNewDashboardName = newDashboardName.trim();
  const willCreateNewDashboard = createNewDashboard || trimmedNewDashboardName.length > 0;
  const hasSelection = selectedDashboardIds.length > 0 || willCreateNewDashboard;
  const isSubmitting = isSubmittingDestinationId !== null;
  const canAddSelection = canSubmit && hasSelection && !isSubmitting;

  const getAddedToastTitle = (destinations: readonly AddedDashboardDestination[]): string => {
    if (destinations.length === 1 && destinations[0]) {
      return tPendingTranslation(
        'Added to {dashboardName}.',
        'Snackbar confirmation after adding an Explore Mode chart to a custom dashboard.',
        translationKey('Label.AddedChartToDashboard', TranslationNamespace.Analytics),
        { dashboardName: destinations[0].name },
      );
    }

    return tPendingTranslation(
      'Added to {count} dashboards.',
      'Snackbar confirmation after adding an Explore Mode chart to multiple custom dashboards.',
      translationKey('Label.AddedChartToMultipleDashboards', TranslationNamespace.Analytics),
      { count: String(destinations.length) },
    );
  };

  const addToSelectedDashboards = async (): Promise<void> => {
    if (!capturedTile || !user) {
      return;
    }

    const selectedDashboards = dashboards.filter((dashboard) =>
      selectedDashboardIds.includes(dashboard.id),
    );
    if (selectedDashboards.length === 0 && !willCreateNewDashboard) {
      return;
    }

    setIsSubmittingDestinationId('submit');
    setWriteError(null);
    setIsOpen(false);
    setToast({
      kind: 'pending',
      title: willCreateNewDashboard ? creatingDashboardLabel : addingLabel,
    });
    try {
      const existingDashboardAdditions = Promise.all(
        selectedDashboards.map(async (dashboard) => {
          const destination =
            dashboard.hybridOrigin === 'server' && service.forkApiDashboardToLocal
              ? await service.forkApiDashboardToLocal(universeId, dashboard.id, {
                  createdByUserId: user.id,
                  createdByUsername: user.name,
                })
              : dashboard;
          await service.addChartTile(
            universeId,
            destination.id,
            { tile: capturedTile },
            { actor: { userId: user.id, username: user.name } },
          );
          return destination;
        }),
      );

      const createdDashboard = willCreateNewDashboard
        ? (async (): Promise<AddedDashboardDestination> => {
            const dashboardName =
              newDashboardName.trim() || (await service.suggestDefaultName(universeId));
            const { config } = addChartTileToConfig({
              config: EMPTY_DASHBOARD_CONFIG,
              tile: capturedTile,
              nextTileId: createTileId(),
            });
            return service.create({
              universeId,
              name: dashboardName,
              createdByUserId: user.id,
              createdByUsername: user.name,
              config,
            });
          })()
        : Promise.resolve(null);

      const [existingDashboards, newDashboard] = await Promise.all([
        existingDashboardAdditions,
        createdDashboard,
      ]);
      const addedDashboards = newDashboard
        ? [...existingDashboards, newDashboard]
        : existingDashboards;

      void queryClient.invalidateQueries({ queryKey: customDashboardQueryKeys.list(universeId) });
      setToast({
        kind: 'success',
        title: getAddedToastTitle(addedDashboards),
        href:
          addedDashboards.length === 1 && addedDashboards[0]
            ? getDashboardEditorHref(universeId, addedDashboards[0].id)
            : getDashboardsManageHref(universeId),
        actionLabel: addedDashboards.length === 1 ? openDashboardLabel : openDashboardsLabel,
      });
    } catch (error) {
      setWriteError(error);
      setToast({ kind: 'error', title: addFailedLabel });
    } finally {
      setIsSubmittingDestinationId(null);
    }
  };

  const handleButtonClick = (): void => {
    if (!canSubmit) {
      return;
    }
    setSelectedDashboardIds([]);
    setCreateNewDashboard(false);
    setNewDashboardName('');
    setWriteError(null);
    setIsOpen(true);
  };

  const toggleDashboardSelection = (dashboardId: string, isChecked: boolean): void => {
    setSelectedDashboardIds((currentIds) =>
      isChecked
        ? Array.from(new Set([...currentIds, dashboardId]))
        : currentIds.filter((id) => id !== dashboardId),
    );
  };

  const handleCreateNewDashboardChange = useCallback((nextChecked: boolean | 'indeterminate') => {
    const checked = nextChecked === true;
    setCreateNewDashboard(checked);
    if (!checked) {
      setNewDashboardName('');
    }
  }, []);

  const handleNewDashboardNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setNewDashboardName(event.target.value);
  }, []);

  const handleCancelClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleToastClose = useCallback(() => {
    setToast(null);
  }, []);

  const handleToastAction = useCallback(() => {
    if (toast?.kind === 'success') {
      onNavigateToDashboard(toast.href);
    }
  }, [onNavigateToDashboard, toast]);

  const button = (
    <Button
      type='button'
      variant='Standard'
      size='Medium'
      isDisabled={!canSubmit}
      onClick={handleButtonClick}>
      {addLabel}
    </Button>
  );

  return (
    <>
      {!canSubmit ? (
        <Tooltip title={disabledLabel} position='top-center'>
          <TooltipTrigger asChild>
            <span>{button}</span>
          </TooltipTrigger>
        </Tooltip>
      ) : (
        button
      )}
      <Dialog
        open={isOpen}
        onOpenChange={setIsOpen}
        size='Medium'
        isModal
        hasCloseAffordance
        closeLabel={closeLabel}
        hasDescription>
        <DialogContent style={dialogContentStyle}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void addToSelectedDashboards();
            }}>
            <DialogBody className='flex flex-col gap-large'>
              <div className='flex flex-col gap-xsmall'>
                <DialogTitle className='text-heading-medium content-emphasis margin-none'>
                  {dialogTitle}
                </DialogTitle>
                <p className='text-body-medium content-default margin-none'>{dialogDescription}</p>
              </div>
              {listQuery.isPending ? <output>{loadingLabel}</output> : null}
              {listQuery.isError ? (
                <p className='text-body-medium content-muted margin-none' role='alert'>
                  {errorLabel}
                </p>
              ) : null}
              {writeError ? (
                <p className='text-body-medium content-muted margin-none' role='alert'>
                  {addFailedLabel}
                </p>
              ) : null}
              {!listQuery.isPending && !listQuery.isError && dashboards.length === 0 ? (
                <p className='text-body-small content-muted margin-none'>{emptyLabel}</p>
              ) : null}
              <div className='flex flex-col gap-medium'>
                {dashboards.length > 0 ? (
                  <div className={dashboardListScrollClassName}>
                    {dashboards.map((dashboard) => (
                      <div key={dashboard.id} className='flex items-center gap-small min-width-0'>
                        <Checkbox
                          size='Medium'
                          placement='Start'
                          label={dashboard.name}
                          isChecked={selectedDashboardIds.includes(dashboard.id)}
                          isDisabled={!canSubmit || isSubmitting}
                          onCheckedChange={(nextChecked) => {
                            toggleDashboardSelection(dashboard.id, nextChecked === true);
                          }}
                        />
                        {dashboard.hybridOrigin === 'localCopy' ? <LocalCopyBadge /> : null}
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className='flex flex-col gap-small shrink-0'>
                  <Checkbox
                    size='Medium'
                    placement='Start'
                    label={newDashboardLabel}
                    isChecked={willCreateNewDashboard}
                    isDisabled={!canSubmit || isSubmitting}
                    onCheckedChange={handleCreateNewDashboardChange}
                  />
                  <div className='padding-left-xlarge'>
                    <TextInput
                      size='Medium'
                      placeholder={newDashboardNamePlaceholder}
                      isDisabled={!canSubmit || isSubmitting}
                      value={newDashboardName}
                      onChange={handleNewDashboardNameChange}
                    />
                  </div>
                </div>
              </div>
            </DialogBody>
            <Divider variant='Standard' />
            <DialogFooter className='flex gap-small padding-top-large'>
              <Button
                type='submit'
                variant='Emphasis'
                size='Medium'
                className='fill basis-0'
                isLoading={isSubmitting}
                isDisabled={!canAddSelection}>
                {isSubmitting ? loadingLabel : submitAddLabel}
              </Button>
              <Button
                type='button'
                variant='Standard'
                size='Medium'
                className='fill basis-0'
                isDisabled={isSubmitting}
                onClick={handleCancelClick}>
                {cancelLabel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {toast ? (
        <Snackbar
          title={toast.title}
          actionLabel={toast.kind === 'success' ? toast.actionLabel : undefined}
          onAction={toast.kind === 'success' ? handleToastAction : undefined}
          closeIconAriaLabel={closeLabel}
          shouldAutoDismiss={toast.kind !== 'pending'}
          autoDismissDurationMs={SnackbarDismissMs}
          onClose={handleToastClose}
        />
      ) : null}
    </>
  );
};

const AddToDashboardPickerCta: FC<AddToDashboardPickerCtaProps> = (props) => (
  <CustomDashboardsShell>
    <AddToDashboardPickerCtaInner {...props} />
  </CustomDashboardsShell>
);

export default AddToDashboardPickerCta;
