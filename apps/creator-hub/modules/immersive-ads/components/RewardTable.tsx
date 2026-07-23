import type { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export interface RewardTableRow {
  key: string | number;
  name: ReactNode;
  placementId: ReactNode;
  status: ReactNode;
  location: ReactNode;
  rewardItem: ReactNode;
  lastUpdate: ReactNode;
  actions?: ReactNode;
}

interface RewardTableProps {
  rows: RewardTableRow[];
}

const RewardTable = ({ rows }: RewardTableProps) => {
  const { translate } = useTranslationWrapper(useTranslation());

  return (
    <div className='margin-top-small [&>div]:bg-none'>
      <Table className='[table-layout:fixed]' size='Medium' variant='Divided'>
        <colgroup>
          <col />
          <col />
          <col />
          <col />
          <col />
          <col />
          <col />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHeaderCell className='!padding-left-xxlarge'>
              {translate(
                translationKey('Heading.PlacementName', TranslationNamespace.ImmersiveAdsAnalytics),
              )}
            </TableHeaderCell>
            <TableHeaderCell>
              {translate(
                translationKey('Heading.PlacementID', TranslationNamespace.ImmersiveAdsAnalytics),
              )}
            </TableHeaderCell>
            <TableHeaderCell>
              {translate(
                translationKey('Label.Status', TranslationNamespace.ImmersiveAdsAnalytics),
              )}
            </TableHeaderCell>
            <TableHeaderCell>
              {translate(
                translationKey('Label.Location', TranslationNamespace.ImmersiveAdsAnalytics),
              )}
            </TableHeaderCell>
            <TableHeaderCell>
              {translate(
                translationKey('Heading.RewardItem', TranslationNamespace.ImmersiveAdsAnalytics),
              )}
            </TableHeaderCell>
            <TableHeaderCell>
              {translate(
                translationKey('Label.LastUpdate', TranslationNamespace.ImmersiveAdsAnalytics),
              )}
            </TableHeaderCell>
            <TableHeaderCell aria-hidden className='!padding-x-small'>
              {null}
            </TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key} className='group height-[64px]' isHoverable>
              <TableCell className='!padding-left-xxlarge'>{row.name}</TableCell>
              <TableCell>{row.placementId}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>{row.location}</TableCell>
              <TableCell>{row.rewardItem}</TableCell>
              <TableCell>{row.lastUpdate}</TableCell>
              <TableCell>
                <div className='flex width-full justify-end'>{row.actions}</div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default withTranslation(RewardTable, [TranslationNamespace.ImmersiveAdsAnalytics]);
