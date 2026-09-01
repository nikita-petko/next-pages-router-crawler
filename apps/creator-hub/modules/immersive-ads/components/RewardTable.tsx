import type { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Tooltip,
  TooltipTrigger,
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
  rewardItem: ReactNode;
  lastUpdate: ReactNode;
  actions?: ReactNode;
}

interface RewardTableProps {
  rows: RewardTableRow[];
  showCustomRewardedTooltip?: boolean;
}

const RewardTable = ({ rows, showCustomRewardedTooltip = false }: RewardTableProps) => {
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
              {showCustomRewardedTooltip ? (
                <Tooltip
                  position='top-center'
                  title={translate(
                    translationKey(
                      'Title.CustomRewardedVideo',
                      TranslationNamespace.ImmersiveAdsAnalytics,
                    ),
                  )}
                  description={translate(
                    translationKey(
                      'Tooltip.CustomIntegration',
                      TranslationNamespace.ImmersiveAdsAnalytics,
                    ),
                  )}
                  hasBeak>
                  <TooltipTrigger asChild>
                    <span className='inline-flex'>
                      {translate(
                        translationKey(
                          'Heading.RewardItem',
                          TranslationNamespace.ImmersiveAdsAnalytics,
                        ),
                      )}
                    </span>
                  </TooltipTrigger>
                </Tooltip>
              ) : (
                translate(
                  translationKey('Heading.RewardItem', TranslationNamespace.ImmersiveAdsAnalytics),
                )
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
