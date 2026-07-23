import { memo, useCallback, useEffect, useRef, useState } from 'react';
import NextLink from 'next/link';
import {
  Badge,
  clsx,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@rbx/foundation-ui';
import { Avatar, TableRow, TableCell } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy } from '@rbx/thumbnails';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import { useIsHovered } from '@modules/monetization-shared/useIsHovered';
import { Tooltip } from '@modules/monetization-shared/tooltip';
import type { GamePass } from '../types';
import { isPassEligibleForRegionalPricing } from '../utils/passesUtils';
import { PassesTableRowCheckbox } from './PassesTableCheckbox';

type Props = GamePass & {
  universeId: number;
  showPriceOptimization?: boolean;
  onToggleRegionalPricing: (passId: number, enabled: boolean) => void;
  disableToggleRegionalPricing?: boolean;
};

const getConfigurePassLink = dashboard.getConfigurePassUrl;

function PassIdCell({
  passId,
  cellRef,
}: {
  passId: number;
  cellRef: React.RefObject<HTMLTableCellElement | null>;
}) {
  const { translate } = useTranslation();

  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const isCopyButtonHovered = useIsHovered(copyButtonRef);
  const isPassIdHovered = useIsHovered(cellRef);
  const [isPassIdCopied, setIsPassIdCopied] = useState(false);

  const handleCopyPassId = useCallback(() => {
    navigator.clipboard.writeText(passId.toString());
    setIsPassIdCopied(true);
  }, [passId]);

  useEffect(() => {
    if (!isPassIdHovered) {
      setIsPassIdCopied(false);
    }
  }, [isPassIdHovered]);

  return (
    <div className='flex items-center justify-start gap-xsmall'>
      <span className='content-default'>{passId}</span>
      <Tooltip
        title={isPassIdCopied ? translate('Message.Copied') : translate('Action.CopyPassID')}
        delayDurationMs={0}
        open={isCopyButtonHovered}>
        <IconButton
          ref={copyButtonRef}
          as='button'
          icon='icon-regular-two-stacked-squares'
          size='Small'
          variant='Utility'
          className={clsx(
            `transition-all duration-100 ease-[ease-in]`,
            isPassIdHovered ? 'visible opacity-[1]' : 'invisible opacity-[0]',
          )}
          onClick={handleCopyPassId}
          ariaLabel={translate('Action.CopyPassID')}
        />
      </Tooltip>
    </div>
  );
}

function MoreItemOptionsMenu({
  configureUrl,
  onToggleRegionalPricing,
  disableToggleRegionalPricing,
  ...pass
}: Omit<Props, 'universeId' | 'showPriceOptimization'> & { configureUrl: string }) {
  const { translate } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleCopyPassId = useCallback(() => {
    navigator.clipboard.writeText(pass.passId.toString());
    setIsOpen(false);
  }, [pass.passId]);

  const handleCopyThumbnailId = useCallback(() => {
    navigator.clipboard.writeText(pass.thumbnailId.toString());
    setIsOpen(false);
  }, [pass.thumbnailId]);

  const handleToggleRegionalPricing = useCallback(() => {
    onToggleRegionalPricing(pass.passId, !pass.isRegionalPricingEnabled);
    setIsOpen(false);
  }, [onToggleRegionalPricing, pass.isRegionalPricingEnabled, pass.passId]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <IconButton
          as='button'
          icon='icon-filled-three-dots-vertical'
          size='Small'
          variant='Utility'
          isCircular
          ariaLabel={translate('Action.MoreOptions')}
        />
      </PopoverTrigger>
      <PopoverContent side='bottom' align='end' ariaLabel={translate('Action.MoreOptions')}>
        <Menu size='Medium'>
          <MenuSection>
            <MenuItem asChild value='settings' title={translate('Action.EditSettings')}>
              <NextLink href={configureUrl} target='_blank' className='no-underline' />
            </MenuItem>
            <MenuItem
              value='copy-pass-id'
              title={translate('Action.CopyPassID')}
              onSelect={handleCopyPassId}
            />
            <MenuItem
              value='copy-thumbnail-id'
              title={translate('Action.CopyThumbnailID')}
              onSelect={handleCopyThumbnailId}
            />
            {isPassEligibleForRegionalPricing(pass) ? (
              <MenuItem
                disabled={disableToggleRegionalPricing}
                value='toggle-regional-pricing'
                onSelect={handleToggleRegionalPricing}
                title={
                  pass.isRegionalPricingEnabled
                    ? translate('Action.DisableRegionalPricing')
                    : translate('Action.EnableRegionalPricing')
                }
              />
            ) : null}
          </MenuSection>
        </Menu>
      </PopoverContent>
    </Popover>
  );
}

function PassesTableRow({
  universeId,
  showPriceOptimization,
  onToggleRegionalPricing,
  disableToggleRegionalPricing,
  ...item
}: Props) {
  const { translate } = useTranslation();

  const passIdCellRef = useRef<HTMLTableCellElement>(null);

  const configureUrl = getConfigurePassLink(universeId, item.passId);

  return (
    <TableRow hover>
      <TableCell padding='checkbox' align='center' className='padding-xlarge'>
        <PassesTableRowCheckbox
          aria-label={translate('Action.SelectProduct', { productName: item.name })}
          {...item}
        />
      </TableCell>

      <TableCell className='max-width-0'>
        <NextLink
          href={configureUrl}
          className='flex items-center min-width-0 gap-small content-inherit no-underline hover:underline'>
          <Avatar variant='rounded' className='radius-circle' alt={item.name}>
            <Thumbnail2d
              targetId={item.passId}
              type={ThumbnailTypes.gamePassIcon}
              returnPolicy={ReturnPolicy.PlaceHolder}
              alt=''
            />
          </Avatar>
          <span className='text-body-medium text-no-wrap text-truncate-end'>{item.name}</span>
        </NextLink>
      </TableCell>

      <TableCell ref={passIdCellRef}>
        <PassIdCell passId={item.passId} cellRef={passIdCellRef} />
      </TableCell>

      <TableCell>
        {item.isForSale ? (
          <span className='flex items-center justify-start gap-xsmall'>
            <Icon name='icon-filled-robux' size='Small' aria-label='Robux' />
            {item.defaultPriceInRobux}
          </span>
        ) : (
          <span className='content-muted'>{translate('Label.Offsale')}</span>
        )}
      </TableCell>
      <TableCell>
        {item.isForSale && (
          <Badge
            label={
              item.isRegionalPricingEnabled
                ? translate('Label.Enabled')
                : translate('Label.Disabled')
            }
            variant={item.isRegionalPricingEnabled ? 'Neutral' : 'Warning'}
            className='flex justify-center min-width-1600'
          />
        )}
      </TableCell>
      {showPriceOptimization && (
        <TableCell>
          {item.isForSale && (
            <Badge
              label={
                item.isInActivePriceOptimizationExperiment
                  ? translate('Label.Active')
                  : translate('Label.Inactive')
              }
              variant={item.isInActivePriceOptimizationExperiment ? 'Contrast' : 'Neutral'}
            />
          )}
        </TableCell>
      )}
      <TableCell padding='checkbox' align='center'>
        <MoreItemOptionsMenu
          configureUrl={configureUrl}
          onToggleRegionalPricing={onToggleRegionalPricing}
          disableToggleRegionalPricing={disableToggleRegionalPricing}
          {...item}
        />
      </TableCell>
    </TableRow>
  );
}

export default memo(PassesTableRow);
