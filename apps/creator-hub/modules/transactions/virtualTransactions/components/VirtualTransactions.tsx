import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import {
  DEFAULT_VIRTUAL_DATE_RANGE,
  getCustomRangeMillis,
  getDateRangeMillis,
  VIRTUAL_MIN_DATE,
} from '../constants/virtualDateRange';
import VirtualDateRangeControl from './VirtualDateRangeControl';
import VirtualTransactionsBanner from './VirtualTransactionsBanner';
import VirtualTransactionsExportButton from './VirtualTransactionsExportButton';
import VirtualTransactionsTable, { type VirtualAccessState } from './VirtualTransactionsTable';

const VirtualTransactions: FunctionComponent<React.PropsWithChildren> = () => {
  const currentGroup = useCurrentGroup();
  const { user } = useAuthentication();

  const groupId = currentGroup?.id;
  const userId = groupId ? undefined : user?.id;

  // Capture "now" once so the default window stays stable across renders and doesn't refetch.
  const [now] = useState<number>(() => Date.now());
  // The applied range, seeded to the default preset window until the user picks one in the calendar.
  const [range, setRange] = useState<{ start: Date; end: Date }>(() => {
    const seed = getDateRangeMillis(DEFAULT_VIRTUAL_DATE_RANGE, now);
    return { start: new Date(seed.startTimeMillis), end: new Date(seed.endTimeMillis) };
  });

  const dateRange = useMemo(() => getCustomRangeMillis(range.start, range.end), [range]);

  const maxEndDate = useMemo(() => new Date(now), [now]);

  const onRangeChange = useCallback((start: Date, end: Date) => {
    setRange({ start, end });
  }, []);

  // Remount key: resets pagination whenever the virtual or the resolved date window changes.
  const tableKey = `${userId ?? ''}-${groupId ?? ''}-${dateRange.startTimeMillis}-${dateRange.endTimeMillis}`;

  // The table's first fetch decides whether the viewer may see this virtual's transactions. Key it
  // on the virtual identity (user/group) alone — NOT the date window — so switching dates doesn't
  // re-hide the chrome while the next window loads. It stays null until that fetch resolves; until
  // then we render only the table (which shows its own spinner) and no chrome, which is what removes
  // the old allowed→blocked flash. Then the chrome shows only if access came back allowed.
  const accessKey = `${userId ?? ''}-${groupId ?? ''}`;
  const [access, setAccess] = useState<{ key: string; state: VirtualAccessState } | null>(null);
  const handleAccessChange = useCallback(
    (state: VirtualAccessState) => setAccess({ key: accessKey, state }),
    [accessKey],
  );
  const showChrome = access?.key === accessKey && access.state === 'allowed';

  return (
    <div className='flex flex-col gap-xxlarge' data-testid='virtual-transactions-id'>
      {showChrome && (
        <>
          <VirtualTransactionsBanner />
          <div className='flex items-center justify-end gap-large'>
            <VirtualDateRangeControl
              startDate={range.start}
              endDate={range.end}
              onRangeChange={onRangeChange}
              minStartDate={VIRTUAL_MIN_DATE}
              maxEndDate={maxEndDate}
            />
            <VirtualTransactionsExportButton
              userId={userId}
              groupId={groupId}
              startTimeMillis={dateRange.startTimeMillis}
              endTimeMillis={dateRange.endTimeMillis}
            />
          </div>
        </>
      )}
      {/* Remount (resetting pagination) whenever the virtual or the resolved date window changes. */}
      <VirtualTransactionsTable
        key={tableKey}
        userId={userId}
        groupId={groupId}
        startTimeMillis={dateRange.startTimeMillis}
        endTimeMillis={dateRange.endTimeMillis}
        onAccessChange={handleAccessChange}
      />
    </div>
  );
};

export default VirtualTransactions;
