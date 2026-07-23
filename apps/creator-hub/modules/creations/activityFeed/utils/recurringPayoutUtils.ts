import { MAX_MEMBER_PAYOUTS_DISPLAYED } from '../constants/activityFeedConstants';

export type MemberPayoutActionType = 'Add' | 'Edit' | 'Remove';

export type MemberPayout = {
  userId: number;
  displayName: string;
  oldPercentage: number;
  newPercentage: number;
  actionType: MemberPayoutActionType;
};

type Translate = (key: string, args?: Record<string, string>) => string;

const memberPayoutTranslationKeys: Record<MemberPayoutActionType, string> = {
  Add: 'Description.MemberPayoutAdded',
  Edit: 'Description.MemberPayoutEdited',
  Remove: 'Description.MemberPayoutRemoved',
};

function isMemberPayout(value: unknown): value is MemberPayout {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<MemberPayout>;
  return (
    typeof candidate.userId === 'number' &&
    typeof candidate.displayName === 'string' &&
    typeof candidate.oldPercentage === 'number' &&
    typeof candidate.newPercentage === 'number' &&
    (candidate.actionType === 'Add' ||
      candidate.actionType === 'Edit' ||
      candidate.actionType === 'Remove')
  );
}

export function parseMemberPayouts(metadataMemberPayouts?: string): MemberPayout[] {
  if (!metadataMemberPayouts) {
    return [];
  }
  try {
    const parsed = JSON.parse(metadataMemberPayouts) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isMemberPayout);
  } catch {
    return [];
  }
}

export function formatMemberPayoutsList(members: MemberPayout[], translate: Translate): string {
  if (members.length === 0) {
    return '';
  }

  const sorted = [...members].sort(
    (a, b) =>
      Math.abs(b.newPercentage - b.oldPercentage) - Math.abs(a.newPercentage - a.oldPercentage),
  );

  const visible = sorted.slice(0, MAX_MEMBER_PAYOUTS_DISPLAYED);
  const overflowCount = sorted.length - visible.length;

  const visibleString = visible
    .map((member) =>
      translate(memberPayoutTranslationKeys[member.actionType], {
        displayName: member.displayName,
        oldPercentage: String(member.oldPercentage),
        newPercentage: String(member.newPercentage),
      }),
    )
    .join(', ');

  if (overflowCount === 0) {
    return visibleString;
  }

  return `${visibleString}, ${translate('Description.MemberPayoutsOverflow', { numRemaining: String(overflowCount) })}`;
}
