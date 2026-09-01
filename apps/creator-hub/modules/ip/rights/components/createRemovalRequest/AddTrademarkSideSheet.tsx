import { useCallback, useMemo, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { IPContentContentTypeEnum, type IPContent } from '@rbx/client-rights/v1';
import {
  Button,
  Chip,
  ProgressCircle,
  RadioGroup,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/components';
import { useInfiniteTrademarksByAccount } from '../../../ipFamilies/hooks/ipFamily';
import TrademarkListItem from './TrademarkListItem';

interface AddTrademarkSideSheetProps {
  onClose: () => void;
  selectedTrademark?: IPContent;
  onConfirm: (selected: IPContent) => void;
}

type TrademarkTypeFilter = 'Text' | 'Image';

const trademarkTypeFilters: TrademarkTypeFilter[] = ['Text', 'Image'];
const TRADEMARK_PAGE_SIZE = 20;
const TRADEMARK_SCROLL_CONTAINER_ID = 'trademark-picker-scroll-container';

/**
 * AddTrademarkSideSheet lets the user pick a single registered trademark (text or
 * image) to attach to a removal request. Unlike the asset picker, there is no
 * search bar: trademarks are filtered by type via pills and selected one at a time.
 */
const AddTrademarkSideSheet = ({
  onClose,
  selectedTrademark,
  onConfirm,
}: AddTrademarkSideSheetProps) => {
  const { translate } = useTranslation();
  const [typeFilter, setTypeFilter] = useState<TrademarkTypeFilter>(
    selectedTrademark?.contentType === IPContentContentTypeEnum.Asset ? 'Image' : 'Text',
  );
  const [selected, setSelected] = useState<IPContent | undefined>(selectedTrademark);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);

  const contentType =
    typeFilter === 'Text' ? IPContentContentTypeEnum.Text : IPContentContentTypeEnum.Asset;
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchNextPageError,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteTrademarksByAccount(contentType, TRADEMARK_PAGE_SIZE);
  const trademarks = useMemo(
    () => data?.pages.flatMap((page) => page.ipContents) ?? [],
    [data?.pages],
  );

  const handleScrollContainerRef = useCallback((element: HTMLDivElement | null) => {
    element?.setAttribute('id', TRADEMARK_SCROLL_CONTAINER_ID);
    setScrollContainer(element);
  }, []);

  const handleTypeFilterChange = useCallback(
    (type: TrademarkTypeFilter) => {
      setTypeFilter(type);
      setSelected(undefined);
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0 });
      }
    },
    [scrollContainer],
  );

  const handleFetchNextPage = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  const handleSelectedIdChange = useCallback(
    (selectedId: string) => {
      setSelected(trademarks.find((trademark) => trademark.id === selectedId));
    },
    [trademarks],
  );

  const chips = trademarkTypeFilters.map((type) => (
    <Chip
      key={type}
      text={type === 'Text' ? translate('Label.Text') : translate('Label.Image')}
      isChecked={typeFilter === type}
      size='Medium'
      onCheckedChange={(isChecked) => isChecked && handleTypeFilterChange(type)}
    />
  ));

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  const handleConfirmClick = () => {
    if (selected) {
      onConfirm(selected);
      onClose();
    }
  };

  return (
    <SheetRoot open onOpenChange={handleOpenChange}>
      <SheetContent
        largeScreenVariant='side'
        closeLabel={translate('Action.Close')}
        largeScreenClassName='![max-width:480px]'>
        <SheetTitle>{translate('Heading.SelectTrademark')}</SheetTitle>
        <div className='flex flex-col gap-medium padding-x-xlarge padding-bottom-medium'>
          <div className='flex flex-row gap-xsmall'>{chips}</div>
        </div>
        <SheetBody ref={handleScrollContainerRef}>
          <div key={typeFilter} className='flex flex-col gap-medium'>
            {isLoading && (
              <div className='flex justify-center padding-top-large'>
                <ProgressCircle variant='Indeterminate' ariaLabel={translate('Label.Loading')} />
              </div>
            )}
            {isError && trademarks.length === 0 && (
              <span className='text-body-medium content-system-alert padding-top-small'>
                {translate('Error.FailedToLoadAssets')}
              </span>
            )}
            {!isLoading && !isError && trademarks.length === 0 && (
              <EmptyStateBorder>
                <EmptyState
                  title={translate('Heading.NoResults')}
                  size='small'
                  illustration='oof'
                />
              </EmptyStateBorder>
            )}
            {!isLoading && scrollContainer && trademarks.length > 0 && (
              <RadioGroup value={selected?.id ?? ''} onValueChange={handleSelectedIdChange}>
                <InfiniteScroll
                  className='flex flex-col gap-small'
                  dataLength={trademarks.length}
                  next={handleFetchNextPage}
                  hasMore={(hasNextPage ?? false) && !isFetchNextPageError}
                  loader={
                    isFetchingNextPage ? (
                      <div className='flex justify-center padding-y-medium'>
                        <ProgressCircle
                          variant='Indeterminate'
                          ariaLabel={translate('Label.Loading')}
                        />
                      </div>
                    ) : undefined
                  }
                  scrollableTarget={TRADEMARK_SCROLL_CONTAINER_ID}>
                  {trademarks.map((trademark) => (
                    <TrademarkListItem
                      key={trademark.id}
                      variant='selecting'
                      trademark={trademark}
                    />
                  ))}
                  {isFetchNextPageError && (
                    <span className='text-body-medium content-system-alert padding-y-small'>
                      {translate('Error.FailedToLoadAssets')}
                    </span>
                  )}
                </InfiniteScroll>
              </RadioGroup>
            )}
          </div>
        </SheetBody>
        <SheetActions className='flex flex-row gap-small'>
          <div className='grow-1 basis-0'>
            <Button isDisabled={!selected} onClick={handleConfirmClick} className='width-full'>
              {translate('Action.Select')}
            </Button>
          </div>
          <div className='grow-1 basis-0'>
            <Button variant='Standard' onClick={onClose} className='width-full'>
              {translate('Label.Cancel')}
            </Button>
          </div>
        </SheetActions>
      </SheetContent>
    </SheetRoot>
  );
};

export default AddTrademarkSideSheet;
