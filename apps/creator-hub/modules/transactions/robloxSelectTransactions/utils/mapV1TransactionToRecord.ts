import type {
  TransactionEntity,
  TransactionRecord,
  TransactionRecordResponse,
  TransactionResponse,
} from '@modules/clients/transactionRecords';
import { AgentType, TransactionEntityType } from '@modules/clients/transactionRecords';

export type MappedRobloxSelectRow = {
  record: TransactionRecord;
  // v1 Select rows include the agent display name (usually the Roblox system user).
  agentName?: string;
};

// Display-only marker so VirtualTransactionCell routes Select rows to RobloxSelectTypeCell.
// Not a v2 ledgerReason.
export const ROBLOX_SELECT_DISPLAY_REASON = 'RobloxSelect';

export const isRobloxSelectDisplayReason = (ledgerReason?: string | null): boolean =>
  ledgerReason === ROBLOX_SELECT_DISPLAY_REASON;

const mapAgentType = (type?: string): TransactionEntity['type'] => {
  if (type === AgentType.Group) {
    return TransactionEntityType.Group;
  }
  if (type === AgentType.User) {
    return TransactionEntityType.User;
  }
  return TransactionEntityType.Unknown;
};

/**
 * Adapts a v1 RobloxSelectTransfer row (user TransactionRecordResponse or group
 * TransactionResponse) into the v2 TransactionRecord shape used by the shared Virtual cells.
 *
 * Keep v1 currency polarity as-is: negative = fee outflow, positive = refund inflow.
 * Status classification for Select inverts Virtual's debit=refund rule (see getTransactionStatus).
 */
export const mapV1TransactionToRecord = (
  row: TransactionRecordResponse | TransactionResponse,
): MappedRobloxSelectRow => {
  const amount = row.currency?.amount;
  const record: TransactionRecord = {
    createdTime: row.created,
    // v1 exposes settlement as isPending; mirror Virtual's hold-status status mapping.
    holdStatus: row.isPending ? 'Active' : 'Settled',
    amount: amount == null ? undefined : String(amount),
    details: row.details ?? undefined,
    counterParty:
      row.agent?.id != null
        ? {
            type: mapAgentType(row.agent.type),
            id: String(row.agent.id),
          }
        : undefined,
  };
  // Runtime sentinel for VirtualTransactionCell / getTransactionStatus; not a real v2 LedgerReason.
  Reflect.set(record, 'ledgerReason', ROBLOX_SELECT_DISPLAY_REASON);

  const agentName = row.agent?.name?.trim();
  return {
    record,
    ...(agentName ? { agentName } : {}),
  };
};
