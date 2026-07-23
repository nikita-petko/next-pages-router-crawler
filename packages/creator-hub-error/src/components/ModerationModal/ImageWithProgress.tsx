import type { FC } from 'react';
import React, { Fragment, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import useModerationModalStyles from './ModerationModal.styles';

/** Violation images can load very slowly because we do work behind the scenes at request time
 * so we'll want to show a spinner to the user to make it look better. */
const ImageWithProgress: FC<{ url: string; altLabelKey?: string }> = ({ url, altLabelKey }) => {
  const { translate } = useTranslation();
  const [loading, setLoading] = useState(true);

  const {
    classes: { image },
  } = useModerationModalStyles();

  return (
    <>
      <img
        style={loading ? { display: 'none' } : {}}
        className={image}
        src={url}
        alt={altLabelKey && translate(altLabelKey)}
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
      {loading && <CircularProgress size={212} />}
    </>
  );
};

export default ImageWithProgress;
