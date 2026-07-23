import type { FunctionComponent } from 'react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { makeStyles } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { OwnerCollaborator } from '../types/ownerCollaborators';
import { UserCell } from './CollaboratorsTable';

const useStyles = makeStyles()({
  tableContainer: {
    '& table': {
      tableLayout: 'auto',
    },
    '& th': {
      whiteSpace: 'nowrap',
    },
  },
});

enum NotAgeVerifiedColumnKey {
  User = 'user',
  Status = 'status',
}

// This component takes all "notAgeVerified" users evaluated from useOwnerCollaborators.tx
// and renders them in a table for the user to see
const NotAgeVerifiedTable: FunctionComponent<{ collaborators: OwnerCollaborator[] }> = ({
  collaborators,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { classes } = useStyles();
  const columnConfigs: TableColumnConfig<NotAgeVerifiedColumnKey>[] = useMemo(
    () => [
      {
        columnKey: NotAgeVerifiedColumnKey.User,
        columnType: ColumnType.Other,
        titleKey: translationKey('TableHeader.User', TranslationNamespace.Creations),
        widthWeight: 1,
      },
      {
        columnKey: NotAgeVerifiedColumnKey.Status,
        columnType: ColumnType.Other,
        titleKey: tPendingTranslation(
          'Status',
          'Column header of a table that will display all impacted accounts, corresponding to the account status of the impacted account',
          translationKey('TableHeader.Status', TranslationNamespace.Creations),
        ),
        widthWeight: 7,
      },
    ],
    [tPendingTranslation],
  );

  const rowData = useMemo(
    () =>
      collaborators.map((collaborator) => {
        const cells: [NotAgeVerifiedColumnKey, CellDataType][] = [
          [
            NotAgeVerifiedColumnKey.User,
            {
              type: ColumnType.Other,
              value: <UserCell collaborator={collaborator} />,
            },
          ],
          [
            NotAgeVerifiedColumnKey.Status,
            {
              type: ColumnType.Other,
              value: tPendingTranslation(
                'Age Verification Needed',
                'This text is displayed next to all accounts that still have not obtained age verification for their account. This will be shown to the Owner when trying to inspect why their experience has been impacted by age gating',
                translationKey('Message.AgeVerificationNeeded', TranslationNamespace.Creations),
              ),
            },
          ],
        ];
        return new Map<NotAgeVerifiedColumnKey, CellDataType>(cells);
      }),
    [collaborators, tPendingTranslation],
  );

  const getRowKey = useCallback(
    (_: Map<NotAgeVerifiedColumnKey, CellDataType>, index: number) =>
      `${collaborators[index]?.userId ?? String(index)}`,
    [collaborators],
  );

  return (
    <GenericTableV2
      columnConfigs={columnConfigs}
      rowData={rowData}
      isDataLoading={false}
      isResponseFailed={false}
      isUserForbidden={false}
      showNoDataMessage={false}
      pagination={null}
      tableConfig={{ hover: true, tableBorder: false }}
      getRowKey={getRowKey}
      classes={{ tableContainer: classes.tableContainer }}
    />
  );
};

export default NotAgeVerifiedTable;
