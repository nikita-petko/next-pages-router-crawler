import type { FC, ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Button, ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { DialogTemplate, useDialog } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type {
  ActionCellType,
  CellDataType,
} from '@modules/charts-generic/tables/types/GenericTableType';
import { useUniverseIdDeprecatedFromAnalytics as useUniverseId } from '@modules/experience-analytics-shared/context/useUniverseID';
import { EmptyState, Link } from '@modules/miscellaneous/components';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  useJourneyConfigs,
  useDeleteJourneyConfig,
} from '../../JourneysCreate/useJourneyConfigStorage';

type JourneyAction = 'view' | 'edit' | 'delete';

enum Col {
  Name = 'name',
  LastModified = 'lastModified',
  Actions = 'actions',
}

const JourneyDeleteConfirmContent: FC<{
  journeyName: string;
  universeId: number;
  onDismiss: () => void;
}> = ({ journeyName, universeId, onDismiss }) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { mutate: deleteJourney, isPending: isDeleting } = useDeleteJourneyConfig(universeId);
  const [deleteError, setDeleteError] = useState(false);

  const handleConfirm = useCallback(() => {
    setDeleteError(false);
    deleteJourney(journeyName, {
      onSuccess: onDismiss,
      onError: () => setDeleteError(true),
    });
  }, [journeyName, onDismiss, deleteJourney]);

  return (
    <DialogTemplate
      color='destructive'
      variant='alert'
      title={tPendingTranslation(
        'Delete journey?',
        'Title of the delete journey confirmation dialog',
        translationKey('Dialog.DeleteJourney.Title', TranslationNamespace.Analytics),
      )}
      content={
        <>
          {tPendingTranslation(
            'Are you sure you want to delete "{name}"? This action cannot be undone.',
            'Body text of the delete journey confirmation dialog',
            translationKey('Dialog.DeleteJourney.Body', TranslationNamespace.Analytics),
            { name: journeyName },
          )}
          {deleteError && (
            <div className='text-body-small content-system-alert margin-top-small'>
              {tPendingTranslation(
                'Failed to delete. Please try again.',
                'Error message when journey deletion fails',
                translationKey('Error.DeleteJourney', TranslationNamespace.Analytics),
              )}
            </div>
          )}
        </>
      }
      confirmText={tPendingTranslation(
        'Delete',
        'Menu item that deletes the selected tile from the custom dashboard editor canvas.',
        translationKey('Action.Delete', TranslationNamespace.Analytics),
      )}
      cancelText={tPendingTranslation(
        'Cancel',
        'Button label for canceling the current action.',
        translationKey('Action.Cancel', TranslationNamespace.Analytics),
      )}
      loading={isDeleting}
      onConfirm={handleConfirm}
      onCancel={onDismiss}
    />
  );
};

const JourneysHomeBody: FC = () => {
  const { tPendingTranslation, tPendingHtmlTranslation } = useTranslationWrapper(useTranslation());
  const router = useRouter();
  const { id } = router.query;
  const universeId = useUniverseId();

  const { data: configs, isLoading, error, refetch } = useJourneyConfigs();
  const { open, close, configure } = useDialog();

  const handleAction = useCallback(
    (actionType: JourneyAction, journeyName: string) => {
      const base = `/dashboard/creations/experiences/${String(id)}/analytics`;
      if (actionType === 'view') {
        void router.push(
          `${base}/journeys/view?filter_JourneyName=${encodeURIComponent(journeyName)}`,
        );
      } else if (actionType === 'edit') {
        void router.push(`${base}/journeys/edit?journeyName=${encodeURIComponent(journeyName)}`);
      } else if (actionType === 'delete') {
        configure(
          <JourneyDeleteConfirmContent
            journeyName={journeyName}
            universeId={universeId}
            onDismiss={close}
          />,
        );
        open();
      }
    },
    [id, universeId, router, configure, open, close],
  );

  const columnConfigs: TableColumnConfig<Col>[] = useMemo(
    () => [
      {
        columnKey: Col.Name,
        columnType: ColumnType.Text,
        titleKey: tPendingTranslation(
          'Journey name',
          'Label for journey name input field',
          translationKey('Label.JourneyName', TranslationNamespace.Analytics),
        ),
        widthWeight: 25,
      },
      {
        columnKey: Col.LastModified,
        columnType: ColumnType.Text,
        titleKey: tPendingTranslation(
          'Last modified',
          'Column header: when the journey was last modified',
          translationKey('Label.LastModified', TranslationNamespace.Analytics),
        ),
        widthWeight: 20,
      },
      {
        columnKey: Col.Actions,
        columnType: ColumnType.Actions,
        titleKey: tPendingTranslation(
          'Actions',
          'Column header: row action menu',
          translationKey('Label.Actions', TranslationNamespace.Analytics),
        ),
        widthWeight: 15,
      },
    ],
    [tPendingTranslation],
  );

  const viewLabel = tPendingTranslation(
    'View',
    'a view button',
    translationKey('Action.View', TranslationNamespace.Analytics),
  );
  const editLabel = tPendingTranslation(
    'Edit config',
    'Action to edit journey configuration',
    translationKey('Action.EditConfig', TranslationNamespace.Analytics),
  );
  const deleteLabel = tPendingTranslation(
    'Delete',
    'Menu item that deletes the selected tile from the custom dashboard editor canvas.',
    translationKey('Action.Delete', TranslationNamespace.Analytics),
  );

  const rowData = useMemo(
    () =>
      (configs ?? []).map((entry) => {
        const actionsCell: ActionCellType<JourneyAction> = {
          type: ColumnType.Actions,
          actions: [
            {
              actionType: 'view',
              actionOn: entry.journeyName,
              onActionInvoked: (name) => handleAction('view', name),
              renderedAsInNonCompactTable: 'menu-item',
              displayLabel: viewLabel,
            },
            {
              actionType: 'edit',
              actionOn: entry.journeyName,
              onActionInvoked: (name) => handleAction('edit', name),
              renderedAsInNonCompactTable: 'menu-item',
              displayLabel: editLabel,
            },
            {
              actionType: 'delete',
              actionOn: entry.journeyName,
              onActionInvoked: (name) => handleAction('delete', name),
              renderedAsInNonCompactTable: 'menu-item',
              displayLabel: deleteLabel,
              color: 'error',
            },
          ],
        };

        return new Map<Col, CellDataType<JourneyAction>>([
          [Col.Name, { type: ColumnType.Text, value: entry.journeyName }],
          [
            Col.LastModified,
            {
              type: ColumnType.Text,
              value: entry.lastModified ? new Date(entry.lastModified).toLocaleDateString() : '—',
            },
          ],
          [Col.Actions, actionsCell],
        ]);
      }),
    [configs, handleAction, viewLabel, editLabel, deleteLabel],
  );

  const getRowKey = useCallback(
    (_: Map<Col, CellDataType<JourneyAction>>, i: number) => configs?.[i]?.journeyName ?? '',
    [configs],
  );

  const handleCreateClick = useCallback(() => {
    const base = `/dashboard/creations/experiences/${String(id)}/analytics`;
    void router.push(`${base}/journeys/create`);
  }, [id, router]);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center [min-height:200px]'>
        <ProgressCircle
          variant='Indeterminate'
          ariaLabel={tPendingTranslation(
            'Loading journey configurations',
            'Aria label for the loading spinner while journey configs are fetched',
            translationKey('Label.LoadingJourneyConfigs', TranslationNamespace.Analytics),
          )}
        />
      </div>
    );
  }

  if (error) {
    return <LoadError onReload={refetch} />;
  }

  if ((configs ?? []).length === 0) {
    return (
      <EmptyState
        illustration='barGraph'
        title={tPendingTranslation(
          'Instrument journey events to track your non-linear funnels',
          'Empty state heading when no journeys have been created',
          translationKey('Heading.NoJourneysYet', TranslationNamespace.Analytics),
        )}
        description={tPendingHtmlTranslation(
          'Set up journeys to see the pathways that players choose. {linkStart}Learn more{linkEnd}',
          'Empty state description; linkStart/linkEnd wraps the "Learn more" anchor to the journeys docs',
          translationKey('Body.NoJourneysDescription', TranslationNamespace.Analytics),
          [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content: (chunks: ReactNode) => (
                <Link
                  href='/docs/production/analytics/journey-events'
                  target='_blank'
                  underline='always'
                  color='inherit'>
                  {chunks}
                </Link>
              ),
            },
          ],
        )}>
        <Button variant='Emphasis' size='Medium' onClick={handleCreateClick}>
          {tPendingTranslation(
            'Create',
            'Button to create a new journey from the empty state',
            translationKey('Action.CreateJourney', TranslationNamespace.Analytics),
          )}
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className='flex flex-col gap-medium'>
      <GenericTableV2
        rowData={rowData}
        columnConfigs={columnConfigs}
        tableConfig={{ stickyHeader: true, hover: true }}
        getRowKey={getRowKey}
        showNoDataMessage={false}
        isDataLoading={false}
        isResponseFailed={false}
        isUserForbidden={false}
      />
    </div>
  );
};

export default JourneysHomeBody;
