import { useCallback, useState } from 'react';
import type { PlayWithRewardServingStatus } from '@rbx/client-developer-ads-stats-api/v1';
import {
  Button,
  Checkbox,
  Divider,
  FeedbackBanner,
  Icon,
  IconButton,
  TextInput,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar, TableBody, TableCell, TableHead, TableRow } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';
import type { RewardItem } from '../types/rewardTypes';
import AddRewardItemModal from './AddRewardItemModal';
import PlayWithRewardStatusLabel from './PlayWithRewardStatusLabel';

const MAX_REWARD_ITEMS = 1;

interface CreatePlacementSetupStepProps {
  impressions: string;
  onImpressionsChange: (value: string) => void;
  isExcludeLikelyPayers: boolean;
  onExcludeLikelyPayersChange: (value: boolean) => void;
  rewardItems: RewardItem[];
  rewardStatus: PlayWithRewardServingStatus;
  showRewardRestartWarning: boolean;
  onRewardItemsChange: (rewardItems: RewardItem[]) => void;
}

const CreatePlacementSetupStep = ({
  impressions,
  onImpressionsChange,
  isExcludeLikelyPayers,
  onExcludeLikelyPayersChange,
  rewardItems,
  rewardStatus,
  showRewardRestartWarning,
  onRewardItemsChange,
}: CreatePlacementSetupStepProps) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const rewardCount = rewardItems.length;
  const frequencyCap = Number(impressions);
  const hasFrequencyCapError = !Number.isInteger(frequencyCap) || frequencyCap <= 0;

  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

  const handleAddRewardItem = useCallback(
    (newRewardItem: RewardItem) => {
      onRewardItemsChange([...rewardItems, newRewardItem]);
      setIsAddModalOpen(false);
    },
    [onRewardItemsChange, rewardItems],
  );

  return (
    <div className='flex flex-col gap-large padding-y-small'>
      {/* Reward items table */}
      <div className='flex flex-col gap-small'>
        <div className='flex items-baseline gap-small'>
          <span className='text-title-large'>
            {translate(
              translationKey('Title.RewardItems', TranslationNamespace.ImmersiveAdsAnalytics),
            )}
          </span>
          <span className='text-body-medium content-muted'>
            {translate(
              translationKey('Label.RewardItemsCount', TranslationNamespace.ImmersiveAdsAnalytics),
              { count: String(rewardCount), max: String(MAX_REWARD_ITEMS) },
            )}
          </span>
        </div>
        <TableBase>
          <colgroup>
            <col className='width-[30%]' />
            <col className='width-[30%]' />
            <col className='width-[30%]' />
            <col className='width-[10%]' />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell className='padding-y-[8px]'>
                {translate(
                  translationKey(
                    'Label.DeveloperProduct',
                    TranslationNamespace.ImmersiveAdsAnalytics,
                  ),
                )}
              </TableCell>
              <TableCell className='padding-y-[8px]'>
                {translate(
                  translationKey(
                    'Label.DeveloperProductID',
                    TranslationNamespace.ImmersiveAdsAnalytics,
                  ),
                )}
              </TableCell>
              <TableCell className='padding-y-[8px]'>
                {translate(
                  translationKey('Label.Status', TranslationNamespace.ImmersiveAdsAnalytics),
                )}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {rewardItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align='center'>
                  <span className='text-body-medium content-muted'>
                    {translate(
                      translationKey(
                        'Label.NoRewardItemsFound',
                        TranslationNamespace.ImmersiveAdsAnalytics,
                      ),
                    )}
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              rewardItems.map((rewardItem, index) => (
                <TableRow key={rewardItem.productId}>
                  <TableCell>
                    <div className='flex items-center gap-small'>
                      {rewardItem.imageAssetId ? (
                        <Avatar variant='rounded' alt={rewardItem.name} className='size-600'>
                          <Thumbnail2d
                            type={ThumbnailTypes.assetThumbnail}
                            targetId={rewardItem.imageAssetId}
                            alt={rewardItem.name}
                          />
                        </Avatar>
                      ) : null}
                      <span>{rewardItem.name || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{rewardItem.productId}</TableCell>
                  <TableCell>
                    <PlayWithRewardStatusLabel playWithRewardServingStatus={rewardStatus} />
                  </TableCell>
                  <TableCell align='right' className='padding-y-[4px]'>
                    <IconButton
                      icon='icon-regular-x'
                      size='Small'
                      variant='Utility'
                      ariaLabel={translate(
                        translationKey(
                          'Action.RemoveRewardItem',
                          TranslationNamespace.ImmersiveAdsAnalytics,
                        ),
                      )}
                      onClick={() =>
                        onRewardItemsChange(
                          rewardItems.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </TableBase>
        <div>
          <Button
            variant='Utility'
            size='Small'
            icon='icon-filled-plus-large'
            isDisabled={rewardCount >= MAX_REWARD_ITEMS}
            onClick={() => setIsAddModalOpen(true)}>
            {translate(
              translationKey('Action.AddItem', TranslationNamespace.ImmersiveAdsAnalytics),
            )}
          </Button>
        </div>
      </div>

      {showRewardRestartWarning && (
        <FeedbackBanner
          severity='Warning'
          variant='Emphasis'
          layout='Inline'
          showIcon
          title={translate(
            translationKey(
              'Warning.RewardItemChangeRestartsTestMode',
              TranslationNamespace.ImmersiveAdsAnalytics,
            ),
          )}
        />
      )}

      <AddRewardItemModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onAdd={handleAddRewardItem}
      />

      <div className='padding-y-medium'>
        <Divider variant='Standard' />
      </div>

      {/* Advanced settings */}
      <div className='flex flex-col gap-xlarge'>
        <h2 className='text-heading-small margin-none'>
          {translate(
            translationKey('Title.AdvancedSettings', TranslationNamespace.ImmersiveAdsAnalytics),
          )}
        </h2>

        {/* Exclude likely payers checkbox */}
        <div className='flex items-center gap-xsmall'>
          <Checkbox
            size='Medium'
            placement='Start'
            isChecked={isExcludeLikelyPayers}
            onCheckedChange={(checked) => onExcludeLikelyPayersChange(checked === true)}
            label={translate(
              translationKey(
                'Label.ExcludeLikelyPayers',
                TranslationNamespace.ImmersiveAdsAnalytics,
              ),
            )}
          />
          <Tooltip
            title={translate(
              translationKey(
                'Description.ExcludeLikelyPayers',
                TranslationNamespace.ImmersiveAdsAnalytics,
              ),
            )}
            position='right-center'
            contentClassName='max-width-[250px] [font-weight:700]'>
            <TooltipTrigger asChild>
              <span className='inline-flex'>
                <Icon name='icon-regular-circle-i' size='Small' />
              </span>
            </TooltipTrigger>
          </Tooltip>
        </div>

        {/* Frequency capping */}
        <div className='flex flex-col gap-small'>
          <div className='flex items-center gap-xsmall'>
            <span className='text-title-large'>
              {translate(
                translationKey(
                  'Title.FrequencyCapping',
                  TranslationNamespace.ImmersiveAdsAnalytics,
                ),
              )}
            </span>
            <Tooltip
              title={translate(
                translationKey(
                  'Description.FrequencyCapping',
                  TranslationNamespace.ImmersiveAdsAnalytics,
                ),
              )}
              position='right-center'
              contentClassName='max-width-[250px] [font-weight:700]'>
              <TooltipTrigger asChild>
                <span className='inline-flex'>
                  <Icon name='icon-regular-circle-i' size='Small' />
                </span>
              </TooltipTrigger>
            </Tooltip>
          </div>

          {/* Impressions row */}
          <div className='flex items-center gap-small'>
            <span className='text-title-medium'>
              {translate(
                translationKey('Label.Impressions', TranslationNamespace.ImmersiveAdsAnalytics),
              )}
            </span>
          </div>
          <div className='flex items-center gap-small'>
            <TextInput
              variant='Standard'
              size='Medium'
              value={impressions}
              onChange={(e) => onImpressionsChange(e.target.value)}
              hasError={hasFrequencyCapError}
              className='width-full max-width-[160px]'
            />
            <span className='text-body-medium content-muted'>
              {translate(
                translationKey('Label.ImpressionsUnit', TranslationNamespace.ImmersiveAdsAnalytics),
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withTranslation(CreatePlacementSetupStep, [
  TranslationNamespace.ImmersiveAdsAnalytics,
]);
