import Papa from 'papaparse';
import { CreatorTicketReadFilter } from '@modules/clients/creatorCommunication';
import type { CreatorTicketExportRow } from '@modules/clients/creatorCommunication';
import {
  TICKET_CATEGORY_EXPORT_LABEL,
  TICKET_STATUS_EXPORT_LABEL,
  TICKET_VIEWED_EXPORT_LABEL,
} from '../constants/ticketLabels';

interface PlayerSupportExportColumn {
  /** Headings are deliberately untranslated so exports stay parseable by column name. */
  heading: string;
  /** IDs and timestamps stay machine-readable, so cells are never locale-formatted. */
  toCell: (row: CreatorTicketExportRow) => string | undefined;
}

const toText = (value: number | undefined): string | undefined =>
  value === undefined ? undefined : String(value);

/**
 * Enums carry no meaning outside the API, so they are exported as the labels creators
 * read. Anything without a label falls back to the raw value, matching how the table
 * renders unrecognized categories.
 */
const toCategoryLabel = (category: CreatorTicketExportRow['category']): string | undefined =>
  category === undefined ? undefined : (TICKET_CATEGORY_EXPORT_LABEL[category] ?? category);

const toStatusLabel = (status: CreatorTicketExportRow['status']): string | undefined =>
  status === undefined ? undefined : (TICKET_STATUS_EXPORT_LABEL[status] ?? status);

/** The row carries a boolean, so it is read through the View filter's own vocabulary. */
const toViewedLabel = (viewed: boolean | undefined): string | undefined => {
  if (viewed === undefined) {
    return undefined;
  }
  return TICKET_VIEWED_EXPORT_LABEL[
    viewed ? CreatorTicketReadFilter.Read : CreatorTicketReadFilter.Unread
  ];
};

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
  { heading: 'Ticket ID', toCell: (row) => row.ticketId },
  { heading: 'Universe ID', toCell: (row) => toText(row.universeId) },
  { heading: 'Title', toCell: (row) => row.title },
  { heading: 'Category', toCell: (row) => toCategoryLabel(row.category) },
  { heading: 'Status', toCell: (row) => toStatusLabel(row.status) },
  { heading: 'Viewed', toCell: (row) => toViewedLabel(row.viewed) },
  { heading: 'Created', toCell: (row) => row.createTime },
  { heading: 'Updated', toCell: (row) => row.updateTime },
  { heading: 'Content', toCell: (row) => row.content },
  { heading: 'User ID', toCell: (row) => row.userId },
  { heading: 'Metadata', toCell: (row) => serializeMetadata(row.metadata) },
];

export const generatePlayerSupportCsv = (rows: readonly CreatorTicketExportRow[]): string =>
  Papa.unparse(
    [
      PLAYER_SUPPORT_EXPORT_COLUMNS.map(({ heading }) => heading),
      ...rows.map((row) => PLAYER_SUPPORT_EXPORT_COLUMNS.map(({ toCell }) => toCell(row) ?? '')),
    ],
    { escapeFormulae: true },
  );

export const getPlayerSupportExportFilename = (
  universeId: number,
  exportedAt: Date = new Date(),
): string =>
  `${universeId}_player_support_${exportedAt.toISOString().replaceAll(/[:.]/g, '-')}.csv`;
