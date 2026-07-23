import React, { FunctionComponent, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  makeStyles,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  TableContainer,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Link,
} from '@rbx/ui';
import { ASSET_ACCESS_PRIVACY } from '@modules/miscellaneous/common/constants/linkConstants';
import IconWithLabel, { IconType } from './IconWithLabel';

const useAssetPrivacyInfographicStyles = makeStyles()(() => ({
  assetTypeListCell: {
    maxWidth: '100px',
  },

  title: {
    marginBottom: '16px',
  },
}));

export type AssetPrivacyInfographicProps = {
  isOpen: boolean;
  onClose: () => void;
};

const AssetPrivacyInfographic: FunctionComponent<
  React.PropsWithChildren<AssetPrivacyInfographicProps>
> = ({ isOpen, onClose }) => {
  const {
    classes: { assetTypeListCell, title },
  } = useAssetPrivacyInfographicStyles();

  const { translate } = useTranslation();

  const tableData = useMemo(
    () => [
      {
        assetTypeList: translate('List.OnlyRestrictedAssetTypes'),
        cells: [
          { canBeRestricted: true, canBeOpenUse: false, key: 'OnlyRestrictedOptIn' },
          { canBeRestricted: true, canBeOpenUse: false, key: 'OnlyRestrictedOptOut' },
        ],
      },
      {
        assetTypeList: translate('List.FlexibleAssetTypes'),
        cells: [
          { canBeRestricted: true, canBeOpenUse: true, key: 'FlexibleOptIn' },
          { canBeRestricted: false, canBeOpenUse: true, key: 'FlexibleOptOut' },
        ],
      },
      {
        assetTypeList: translate('Label.AvatarItem'),
        cells: [
          { canBeRestricted: false, canBeOpenUse: true, key: 'AvatarItemOptIn' },
          { canBeRestricted: false, canBeOpenUse: true, key: 'AvatarItemOptOut' },
        ],
      },
    ],
    [translate],
  );

  return (
    <Dialog open={isOpen}>
      <DialogTitle className={title}>{translate('Heading.HowItWorks')} </DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='secondary'>
          {translate('Description.WhenOptedIn')}
          <Link href={ASSET_ACCESS_PRIVACY} target='_blank'>
            {' '}
            {translate('Label.LearnMore')}
          </Link>
        </Typography>
        <TableContainer style={{}}>
          <Table padding='normal' size='medium'>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography>{translate('Label.AssetType')}</Typography>
                </TableCell>
                <TableCell>
                  <Typography>
                    <IconWithLabel iconType={IconType.Lock} label={translate('Label.OptedIn')} />
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography>
                    <IconWithLabel
                      iconType={IconType.LockOpen}
                      label={translate('Label.OptedOut')}
                    />
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.map(({ assetTypeList, cells }) => (
                <TableRow key={assetTypeList}>
                  <TableCell className={assetTypeListCell}>{assetTypeList}</TableCell>
                  {cells.map(({ canBeRestricted, canBeOpenUse, key }) => (
                    <TableCell key={key}>
                      <Typography variant='body2'>
                        <IconWithLabel
                          iconType={canBeRestricted ? IconType.Check : IconType.Close}
                          label={translate('Label.Restricted')}
                        />
                      </Typography>
                      <Typography variant='body2'>
                        <IconWithLabel
                          iconType={canBeOpenUse ? IconType.Check : IconType.Close}
                          label={translate('Label.OpenUse')}
                        />
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button variant='contained' onClick={onClose}>
          {translate('Action.GotIt')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssetPrivacyInfographic;
