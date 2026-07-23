import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { externalLinks } from '@modules/navigation/footer/constants/externalLinkConstants';
import { Link, Typography } from '@rbx/ui';

const TermsOfServiceLabel: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translateHTML } = useTranslation();
  return (
    <Typography color='secondary'>
      {translateHTML('Label.AgreeToTermsOfService', [
        {
          opening: 'TOSLinkStart',
          closing: 'TOSLinkEnd',
          content(chunks) {
            return (
              <Link href={externalLinks.termsOfServiceURL} target='_blank'>
                {chunks}
              </Link>
            );
          },
        },
      ])}
    </Typography>
  );
};

export default TermsOfServiceLabel;
