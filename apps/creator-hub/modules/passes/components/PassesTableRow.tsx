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
import { Locale, useLocalization, useTranslation, useTranslationWithNamespace } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy } from '@rbx/thumbnails';
import { Avatar, TableRow, TableCell } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { formatDate } from '@modules/miscellaneous/utils/dateUtils';
import { logProductArchiveClick } from '@modules/monetization-shared/archive-dialog/logging';
import { Tooltip } from '@modules/monetization-shared/tooltip';
import { useIsHovered } from '@modules/monetization-shared/useIsHovered';
import type { GamePass } from '../types';
import { openGamePassArchiveDialog } from './GamePassArchiveDialog';
import { PassesTableRowCheckbox } from './PassesTableCheckbox';

type Props = GamePass & {
  universeId: number;
  /** `undefined` = archive feature off; `false` = active tab; `true` = archived tab. */
  showArchived?: boolean;
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
    void navigator.clipboard.writeText(passId.toString());
    setIsPassIdCopied(true);
  }, [passId]);

  /* oxlint-disable react/react-compiler -- resetting copy state on hover-out; setState is intentional here */
  useEffect(() => {
    if (!isPassIdHovered) {
      setIsPassIdCopied(false);
    }
  }, [isPassIdHovered]);
  /* oxlint-enable react/react-compiler */

  return (
    <div className='flex items-center justify-start gap-xsmall'>
      <span className='content-default'>{passId}</span>
      <Tooltip
        title={isPassIdCopied ? translate('Message.Copied') : translate('Action.CopyPassID')}
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

function ArchiveMenuItem({
  universeId,
  passId,
  isArchived,
  onActionSelected,
}: {
  universeId: number;
  passId: number;
  isArchived: boolean;
  onActionSelected: () => void;
}) {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Creations);

  const handleSelect = useCallback(() => {
    logProductArchiveClick({
      productType: 'gamePass',
      itemId: passId,
      universeId,
      isArchived,
    });
    openGamePassArchiveDialog({
      universeId,
      gamePassId: passId,
      isArchived,
    });
    onActionSelected();
  }, [universeId, passId, isArchived, onActionSelected]);

  return (
    <MenuItem
      value={isArchived ? 'unarchive' : 'archive'}
      title={isArchived ? translate('Action.Unarchive') : translate('Action.Archive')}
      onSelect={handleSelect}
    />
  );
}

function MoreItemOptionsMenu({
  configureUrl,
  universeId,
  showArchived,
  ...pass
}: Props & { configureUrl: string }) {
  const { translate } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleCopyPassId = useCallback(() => {
    void navigator.clipboard.writeText(pass.passId.toString());
    setIsOpen(false);
  }, [pass.passId]);

  const handleCopyThumbnailId = useCallback(() => {
    void navigator.clipboard.writeText(pass.thumbnailId.toString());
    setIsOpen(false);
  }, [pass.thumbnailId]);

  const handleCloseMenu = useCallback(() => setIsOpen(false), []);

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
            {showArchived !== undefined && (
              <ArchiveMenuItem
                universeId={universeId}
                passId={pass.passId}
                isArchived={showArchived}
                onActionSelected={handleCloseMenu}
              />
            )}
          </MenuSection>
        </Menu>
      </PopoverContent>
    </Popover>
  );
}

function PassesTableRow({ universeId, showArchived, ...item }: Props) {
  const { translate } = useTranslation();
  const { locale } = useLocalization();

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

      {!showArchived && (
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
      )}
      {!showArchived && (
        <TableCell>
          {item.isForSale && (
            <Badge
              label={
                item.isManagedPricingEnabled
                  ? translate('Label.Enabled')
                  : translate('Label.Disabled')
              }
              variant={item.isManagedPricingEnabled ? 'Neutral' : 'Warning'}
              className='flex justify-center min-width-1600'
            />
          )}
        </TableCell>
      )}
      {showArchived && (
        <TableCell>
          <span className='content-default'>
            {formatDate(item.updatedTimestamp, locale ?? Locale.English)}
          </span>
        </TableCell>
      )}
      <TableCell padding='checkbox' align='center'>
        <MoreItemOptionsMenu
          configureUrl={configureUrl}
          universeId={universeId}
          showArchived={showArchived}
          {...item}
        />
      </TableCell>
    </TableRow>
  );
}

export default memo(PassesTableRow);
