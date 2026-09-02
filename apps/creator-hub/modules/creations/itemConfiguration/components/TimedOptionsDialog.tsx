import { useMemo } from 'react';
import type { RobloxItemConfigurationApiRentalOption } from '@rbx/client-itemconfiguration/v1';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { NumberIcon } from '@modules/charts-generic/charts/numberFormatters';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type {
  CellDataType,
  TableConfig,
} from '@modules/charts-generic/tables/types/GenericTableType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  DurationOptionsEnum,
  mapDurationToDays,
  mapDurationToString,
} from '../../unifiedFeeSystem/helper/UnifiedFeeSystemConstants';

enum ColumnKey {
  Duration = 'duration',
  Price = 'price',
}

interface TimedOptionsDialogProps {
  showTimedOptionsDialog: boolean;
  setShowTimedOptionsDialog: (show: boolean) => void;
  rentalPricingData: RobloxItemConfigurationApiRentalOption[];
}

function TimedOptionsDialog(props: TimedOptionsDialogProps) {
  const { showTimedOptionsDialog, setShowTimedOptionsDialog, rentalPricingData } = props;
  const { translate } = useTranslation();

  const columnConfigs: TableColumnConfig<ColumnKey>[] = useMemo(
    () => [
      {
        columnKey: ColumnKey.Duration,
        columnType: ColumnType.Text,
        titleKey: { key: 'Title.Duration', namespace: TranslationNamespace.ConfigureItem },
        widthWeight: 1,
      },
      {
        columnKey: ColumnKey.Price,
        columnType: ColumnType.Number,
        titleKey: { key: 'Title.Price', namespace: TranslationNamespace.ConfigureItem },
        widthWeight: 1,
        analyticsNumberFormattingSpec: {
          abbreviate: false,
          numberFormatOptions: {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          },
          icon: NumberIcon.Robux,
        },
      },
    ],
    [],
  );

  const rowData: Map<ColumnKey, CellDataType>[] = useMemo(() => {
    function getPriceForDuration(duration: DurationOptionsEnum): string {
      // For permanent duration, rentalPrice.rentalDays is undefined from BE
      if (duration === DurationOptionsEnum.Permanent) {
        const permanentPrice = rentalPricingData.find(
          (rentalPrice) => rentalPrice.rentalDays === undefined,
        );
        return permanentPrice?.priceInRobux?.toString() ?? '';
      }

      // For other durations, match by rentalDays
      return (
        rentalPricingData
          .find((rentalPrice) => rentalPrice.rentalDays === mapDurationToDays(duration))
          ?.priceInRobux?.toString() ?? ''
      );
    }

    return Object.values(DurationOptionsEnum).map((duration) => {
      const map = new Map<ColumnKey, CellDataType>();

      // Duration column
      map.set(ColumnKey.Duration, {
        type: ColumnType.Text,
        value: translate(`Action.${mapDurationToString(duration)}`),
      });

      map.set(ColumnKey.Price, {
        type: ColumnType.Number,
        value: parseFloat(getPriceForDuration(duration)),
      });

      return map;
    });
  }, [translate, rentalPricingData]);

  const tableConfig: TableConfig<ColumnKey> = useMemo(
    () => ({
      showHeader: true,
      showFooter: false,
      stickyHeader: false,
    }),
    [],
  );

  return (
    <Dialog
      open={showTimedOptionsDialog}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setShowTimedOptionsDialog(false);
        }
      }}
      size='Medium'
      isModal
      hasCloseAffordance={false}>
      <DialogContent>
        <DialogBody>
          <DialogTitle className='text-heading-small margin-none'>
            {translate('Title.TimedOptions')}
          </DialogTitle>
          <div className='text-body-medium content-muted margin-top-[10px]'>
            {translate('Description.TimedOptionsDialog')}
          </div>
          <div className='text-label-large margin-top-[16px]'>
            {translate('Label.HowAreThesePricesSet')}
          </div>
          <div className='text-body-medium content-muted margin-top-[10px]'>
            {translate('Description.HowAreThesePricesSet')}
          </div>
          <div className='margin-top-[16px]'>
            <GenericTableV2
              rowData={rowData}
              columnConfigs={columnConfigs}
              tableConfig={tableConfig}
              isDataLoading={false}
              isResponseFailed={false}
              isUserForbidden={false}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant='Standard'
            type='button'
            onClick={() => {
              setShowTimedOptionsDialog(false);
            }}>
            {translate('Action.Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TimedOptionsDialog;
