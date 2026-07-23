import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import { useMediaQuery, useTheme, Grid, Button } from '@rbx/ui';
import { SaleLocationEnum } from '../helper/UnifiedFeeSystemConstants';
import SavePanel from './SavePanel';

interface NonSellableSavePanelProps {
  targetId: number;
  name: string;
  description: string;
  isBundle: boolean;
  displayInfoChanged: boolean;
}

function NonSellableSavePanel(props: NonSellableSavePanelProps) {
  const { targetId, name, description, isBundle, displayInfoChanged } = props;
  const { translate } = useTranslation();
  const router = useRouter();

  const theme = useTheme();
  const isXlScreen = useMediaQuery(theme.breakpoints.up('XXLarge'));

  const handleCancelChanges = () => {
    router.back();
  };

  return (
    <div style={{ width: '100%', maxWidth: '1800px', paddingRight: isXlScreen ? '10%' : '0%' }}>
      <Grid container>
        <Grid item marginTop='40px'>
          <Button
            color='primary'
            onClick={handleCancelChanges}
            variant='outlined'
            style={{ padding: '12px' }}>
            {translate('Action.Cancel')}
          </Button>
        </Grid>
        <Grid item style={{ marginLeft: '20px' }}>
          <SavePanel
            updateDisplayInfoOnly
            isBundle={isBundle}
            targetId={targetId}
            name={name}
            description={description}
            collectibleItemId=''
            isOnSale={false}
            limit={0}
            isResellable={false}
            originalIsResellable={false}
            optionalPriceFloor={undefined}
            priceOffset={0}
            price={0}
            isFree={false}
            saleLocation={SaleLocationEnum.MarketplaceOnly}
            selectedPlaces={[]}
            isSaveDisabled={false}
            collectiblesMetadata={undefined}
            optOutFromRegionalPricing={false}
            isRentableOptIn={false}
            displayInfoChanged={displayInfoChanged}
          />
        </Grid>
      </Grid>
    </div>
  );
}

export default NonSellableSavePanel;
