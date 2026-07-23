import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { DEFAULT_VALUES } from '@modules/server-management/constants';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import { IconButton } from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import useUniversePlaces from '../../hooks/useUniversePlaces';

const ServerListHeader: FunctionComponent = () => {
  const { translate } = useTranslation();

  const { placesInfo } = useUniversePlaces();
  const router = useRouter();

  const { placeId: queryPlaceId } = router.query;
  const rawPlaceId = Array.isArray(queryPlaceId) ? queryPlaceId[0] : queryPlaceId;
  const placeId = rawPlaceId != null && rawPlaceId !== '' ? parseInt(rawPlaceId, 10) : null;

  const place = useMemo(() => {
    if (!placeId || !placesInfo || placesInfo.length === 0) return null;
    const id = typeof placeId === 'string' ? parseInt(placeId, 10) : placeId;
    return placesInfo.find((p) => p.placeId === id);
  }, [placeId, placesInfo]);

  const placeDisplayId = placeId?.toString() ?? DEFAULT_VALUES.PLACE_ID.toString();
  const placeDisplayName = place?.name ?? placeDisplayId;

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <div className='flex items-center width-full gap-medium wrap'>
      <div>
        <IconButton
          icon='icon-regular-chevron-large-left'
          variant='Utility'
          size='Small'
          ariaLabel='Back to server list'
          onClick={handleBack}
        />
      </div>
      <div>
        <header>
          <Typography variant='h3'>
            {translate('Heading.ServerList', { placeName: placeDisplayName })}
          </Typography>
        </header>
        <Typography>{translate('Subtitle.ServerList', { placeId: placeDisplayId })}</Typography>
      </div>
    </div>
  );
};

export default ServerListHeader;
