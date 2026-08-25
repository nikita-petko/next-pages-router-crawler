import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  IconButton,
  ProgressCircle,
  TextInput,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { RobuxIcon } from '@rbx/ui';
import { ITEM_PICKER_PAGE_SIZE, MAX_SHOWCASE_ITEMS } from '../constants';
import useResolveShowcaseItems from '../queries/useResolveShowcaseItems';
import useShowcaseEligibleItems from '../queries/useShowcaseEligibleItems';
import type { ShowcaseItem, ShowcaseItemRejectionReason } from '../types';
import { parseAssetIdInput } from '../utils/showcaseValidation';

type ShowcaseItemPickerDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (items: ShowcaseItem[]) => void;
  communityId: number | undefined;
  /** Items already on the draft; they consume capacity and cannot be re-picked. */
  existingItems: ShowcaseItem[];
};

/**
 * Chips and row checkboxes drive a single selection set — typing an id and ticking
 * a row are two routes to the same thing, so removing a chip also unticks the row.
 */
const ShowcaseItemPickerDialog = ({
  isOpen,
  onClose,
  onAdd,
  communityId,
  existingItems,
}: ShowcaseItemPickerDialogProps) => {
  const { translate } = useTranslation();

  const [page, setPage] = useState(0);
  const [idInput, setIdInput] = useState('');
  const [selected, setSelected] = useState<ShowcaseItem[]>([]);
  const [rejections, setRejections] = useState<ShowcaseItemRejectionReason[]>([]);

  const { data, isPending } = useShowcaseEligibleItems(communityId, page, ITEM_PICKER_PAGE_SIZE, {
    enabled: isOpen,
  });
  const { mutate: resolveItems, isPending: isResolving } = useResolveShowcaseItems(communityId);

  const existingIds = useMemo(() => existingItems.map((i) => i.assetId), [existingItems]);
  const selectedIds = useMemo(() => new Set(selected.map((i) => i.assetId)), [selected]);

  const totalAfterAdd = existingItems.length + selected.length;
  const remainingCapacity = MAX_SHOWCASE_ITEMS - totalAfterAdd;
  const isAtCapacity = remainingCapacity <= 0;

  const total = data?.total ?? 0;
  const rangeStart = total === 0 ? 0 : page * ITEM_PICKER_PAGE_SIZE + 1;
  const rangeEnd = Math.min((page + 1) * ITEM_PICKER_PAGE_SIZE, total);
  const lastPage = Math.max(0, Math.ceil(total / ITEM_PICKER_PAGE_SIZE) - 1);

  const toggleItem = useCallback((item: ShowcaseItem) => {
    setRejections([]);
    setSelected((current) =>
      current.some((i) => i.assetId === item.assetId)
        ? current.filter((i) => i.assetId !== item.assetId)
        : [...current, item],
    );
  }, []);

  const removeSelected = useCallback((assetId: number) => {
    setSelected((current) => current.filter((i) => i.assetId !== assetId));
  }, []);

  const commitIdInput = useCallback(() => {
    const assetIds = parseAssetIdInput(idInput);
    if (assetIds.length === 0) {
      return;
    }

    resolveItems(
      { assetIds, existingAssetIds: [...existingIds, ...selected.map((i) => i.assetId)] },
      {
        onSuccess: (resolved) => {
          const accepted = resolved.flatMap((entry) => (entry.ok ? [entry.item] : []));
          const reasons = resolved.flatMap((entry) => (entry.ok ? [] : [entry.reason]));
          setSelected((current) => [...current, ...accepted].slice(0, MAX_SHOWCASE_ITEMS));
          setRejections(reasons);
          setIdInput('');
        },
      },
    );
  }, [existingIds, idInput, resolveItems, selected]);

  const handleClose = useCallback(() => {
    setSelected([]);
    setIdInput('');
    setRejections([]);
    setPage(0);
    onClose();
  }, [onClose]);

  const handleAdd = useCallback(() => {
    onAdd(selected);
    handleClose();
  }, [handleClose, onAdd, selected]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
        }
      }}
      size='Medium'
      isModal
      hasCloseAffordance
      closeLabel={translate('Action.Close')}>
      <DialogContent>
        <DialogBody>
          <DialogTitle className='text-heading-small margin-none'>
            {translate('Heading.SelectAvatarItem')}
          </DialogTitle>
          {/* Foundation 0.116 does not re-export DialogDescription, so this follows the
              plain-text pattern already used by the recommendation-service dialogs. */}
          <div className='text-body-medium content-muted'>
            {translate('Description.SelectAvatarItem')}
          </div>

          <div className='flex flex-col gap-medium padding-top-medium'>
            <div className='flex flex-col gap-small'>
              <TextInput
                id='showcase-item-ids'
                size='Medium'
                label={translate('Label.EnterAvatarItemId')}
                value={idInput}
                isDisabled={isAtCapacity || isResolving}
                onChange={(event) => setIdInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    commitIdInput();
                  }
                }}
              />
              {selected.length > 0 && (
                <div className='flex wrap gap-xsmall'>
                  {selected.map((item) => (
                    <Chip
                      key={item.assetId}
                      text={String(item.assetId)}
                      size='Small'
                      variant='Standard'
                      isChecked={false}
                      trailingIconName='icon-filled-x'
                      onCheckedChange={() => removeSelected(item.assetId)}
                    />
                  ))}
                </div>
              )}
              {rejections.length > 0 && (
                <span className='text-body-small content-system-alert'>
                  {translate('Description.ShowcaseItemsRejected', {
                    count: String(rejections.length),
                  })}
                </span>
              )}
            </div>

            {isPending ? (
              <div className='flex justify-center padding-y-large'>
                <ProgressCircle
                  ariaLabel={translate('Label.Loading')}
                  size='Medium'
                  variant='Indeterminate'
                />
              </div>
            ) : (
              <ul className='flex flex-col margin-none padding-none [list-style:none]'>
                {(data?.items ?? []).map((item) => {
                  const isSelected = selectedIds.has(item.assetId);
                  const isAlreadyOnDraft = existingIds.includes(item.assetId);
                  return (
                    <li key={item.assetId} className='flex items-center gap-medium padding-y-small'>
                      <Checkbox
                        size='Medium'
                        placement='End'
                        aria-label={item.name}
                        isChecked={isSelected}
                        isDisabled={isAlreadyOnDraft || (!isSelected && isAtCapacity)}
                        onCheckedChange={() => toggleItem(item)}
                      />
                      <div className='size-[40px] radius-small clip bg-shift-200 shrink-0'>
                        <Thumbnail2d
                          alt={item.name}
                          returnPolicy={ReturnPolicy.PlaceHolder}
                          targetId={item.assetId}
                          type={ThumbnailTypes.assetThumbnail}
                        />
                      </div>
                      <span className='grow-1 text-label-medium content-emphasis text-truncate-end min-width-0'>
                        {item.name}
                      </span>
                      {item.price !== null && (
                        <span className='flex items-center gap-xxsmall text-label-medium content-emphasis shrink-0'>
                          <RobuxIcon fontSize='small' />
                          {item.price}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className='flex items-center justify-end gap-small'>
              <span className='text-body-small content-muted'>
                {translate('Description.ShowcaseItemPickerRange', {
                  rangeStart: String(rangeStart),
                  rangeEnd: String(rangeEnd),
                  total: String(total),
                })}
              </span>
              <IconButton
                variant='Standard'
                size='Small'
                ariaLabel={translate('Action.FirstPage')}
                icon='icon-regular-chevron-large-left'
                isDisabled={page === 0}
                onClick={() => setPage(0)}
              />
              <IconButton
                variant='Standard'
                size='Small'
                ariaLabel={translate('Action.PreviousPage')}
                icon='icon-regular-chevron-small-left'
                isDisabled={page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              />
              <IconButton
                variant='Standard'
                size='Small'
                ariaLabel={translate('Action.NextPage')}
                icon='icon-regular-chevron-small-right'
                isDisabled={page >= lastPage}
                onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
              />
              <IconButton
                variant='Standard'
                size='Small'
                ariaLabel={translate('Action.LastPage')}
                icon='icon-regular-chevron-large-right'
                isDisabled={page >= lastPage}
                onClick={() => setPage(lastPage)}
              />
            </div>

            <span className='text-body-small content-muted'>
              {translate('Description.ShowcaseItemPickerCount', {
                selectedCount: String(totalAfterAdd),
                maxItems: String(MAX_SHOWCASE_ITEMS),
              })}
            </span>
          </div>
        </DialogBody>
        <DialogFooter>
          <div className='flex gap-small'>
            <Button
              variant='Emphasis'
              type='button'
              isDisabled={selected.length === 0}
              onClick={handleAdd}>
              {translate('Action.Add')}
            </Button>
            <Button variant='Standard' type='button' onClick={handleClose}>
              {translate('Action.Cancel')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShowcaseItemPickerDialog;
