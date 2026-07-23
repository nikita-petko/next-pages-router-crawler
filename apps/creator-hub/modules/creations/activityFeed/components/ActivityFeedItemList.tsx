import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Table, TableBody, TableCell, TableContainer, TableHead, Typography } from '@rbx/ui';
import type { ActivityFeedItemInfo } from '../hooks/useActivityFeedItemInfo';
import ActivityFeedItem from './ActivityFeedItem';
import useActivityFeedItemListStyles from './ActivityFeedItemList.styles';

interface ActivityFeedItemListProps {
  activityFeedItems: ActivityFeedItemInfo[];
  isSmallScreen: boolean;
  includeLocationColumn: boolean;
}

const ActivityFeedItemList: FunctionComponent<
  React.PropsWithChildren<ActivityFeedItemListProps>
> = ({ activityFeedItems, isSmallScreen, includeLocationColumn }) => {
  const {
    classes: { table },
  } = useActivityFeedItemListStyles();
  const { translate } = useTranslation();

  const tableHeader = useMemo(
    () => (
      <TableHead>
        <TableCell width='65%'>
          <Typography variant='tableHead'>{translate('Heading.TableColumnEvent')}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant='tableHead'>{translate('Heading.TableColumnChangedBy')}</Typography>
        </TableCell>
        {includeLocationColumn && (
          <TableCell>
            <Typography variant='tableHead'>{translate('Heading.TableColumnLocation')}</Typography>
          </TableCell>
        )}
        <TableCell width='5%' />
      </TableHead>
    ),
    [translate, includeLocationColumn],
  );

  return (
    <TableContainer>
      <Table className={table}>
        {!isSmallScreen && tableHeader}
        <TableBody>
          {activityFeedItems.map((item) => (
            <ActivityFeedItem
              key={item.id}
              activityFeedItemInfo={item}
              isSmallScreen={isSmallScreen}
              includeLocation={includeLocationColumn}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ActivityFeedItemList;
