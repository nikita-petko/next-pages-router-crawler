// @ts-nocheck
import { PlayArrowIcon, TableCell } from '@rbx/ui';
import { ReactElement } from 'react';

import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import { creativePreviewDefaultImagePath } from '@modules/creation/components/constants/assetConstants';

const TableVideoPreviewCell = ({
  cellClassName,
  isLoading,
  onClick,
  overrideThumbVideoPlayer,
  uploadedVideoObjectUrl = '',
}: {
  cellClassName?: string;
  isLoading?: boolean;
  onClick?: () => void;
  overrideThumbVideoPlayer?: ReactElement<any>;
  uploadedVideoObjectUrl: string;
}) => {
  if (isLoading) {
    return (
      <TableCell align='center' className={cellClassName || ''}>
        <CenteredCircularProgress />
      </TableCell>
    );
  }

  if (uploadedVideoObjectUrl === '') {
    return (
      <TableCell align='center' className={cellClassName || ''}>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <img
          alt='Could Not Fetch Video'
          onClick={onClick}
          onKeyPress={onClick}
          src={creativePreviewDefaultImagePath}
          style={{ height: '100%', width: '100%' }}
        />
      </TableCell>
    );
  }

  return (
    <TableCell align='center' className={cellClassName || ''}>
      <div
        data-testid='override-thumb-player'
        style={{ display: 'flex', height: '100%', position: 'relative', width: '100%' }}>
        {overrideThumbVideoPlayer}
        {
          <PlayArrowIcon
            data-testid='play-arrow-icon'
            style={{
              left: '50%',
              pointerEvents: 'none', // Ensures clicks pass through to the video element
              position: 'absolute',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        }
      </div>
    </TableCell>
  );
};

export default TableVideoPreviewCell;
