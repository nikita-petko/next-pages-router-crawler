import Papa from 'papaparse';
import type { CreatorTicketExportRow } from '@modules/clients/creatorCommunication';

interface PlayerSupportExportColumn {
  /** Headings are deliberately untranslated so exports stay parseable by column name. */
  englishLabel: string;
  /** IDs, enums and timestamps stay machine-readable, so cells are never locale-formatted. */
  toCell: (row: CreatorTicketExportRow) => string | undefined;
}

const toText = (value: number | boolean | undefined): string | undefined =>
  value === undefined ? undefined : String(value);

const serializeMetadata = (metadata: CreatorTicketExportRow['metadata']): string => {
  if (!metadata) {
    return '';
  }

  const sortedMetadata = Object.fromEntries(
    Object.entries(metadata).toSorted(([leftKey], [rightKey]) =>
      leftKey < rightKey ? -1 : leftKey === rightKey ? 0 : 1,
    ),
  );
  return JSON.stringify(sortedMetadata);
};

/** Single source of truth for the export: add a column here and it appears everywhere. */
export const PLAYER_SUPPORT_EXPORT_COLUMNS: readonly PlayerSupportExportColumn[] = [
  { englishLabel: 'Ticket ID', toCell: (row) => row.ticketId },
  { englishLabel: 'Universe ID', toCell: (row) => toText(row.universeId) },
  { englishLabel: 'Title', toCell: (row) => row.title },
  { englishLabel: 'Category', toCell: (row) => row.category },
  { englishLabel: 'Status', toCell: (row) => row.status },
  { englishLabel: 'Viewed', toCell: (row) => toText(row.viewed) },
  { englishLabel: 'Created', toCell: (row) => row.createTime },
  { englishLabel: 'Updated', toCell: (row) => row.updateTime },
  { englishLabel: 'Content', toCell: (row) => row.content },
  { englishLabel: 'User ID', toCell: (row) => row.userId },
  { englishLabel: 'Metadata', toCell: (row) => serializeMetadata(row.metadata) },
];

export const generatePlayerSupportCsv = (rows: readonly CreatorTicketExportRow[]): string =>
  Papa.unparse(
    [
      PLAYER_SUPPORT_EXPORT_COLUMNS.map(({ englishLabel }) => englishLabel),
      ...rows.map((row) => PLAYER_SUPPORT_EXPORT_COLUMNS.map(({ toCell }) => toCell(row) ?? '')),
    ],
    { escapeFormulae: true },
  );

export const getPlayerSupportExportFilename = (
  universeId: number,
  exportedAt: Date = new Date(),
): string =>
  `${universeId}_player_support_${exportedAt.toISOString().replaceAll(/[:.]/g, '-')}.csv`;
