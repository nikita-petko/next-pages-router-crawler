import type { FunctionComponent } from 'react';
import React from 'react';
import SharedMoreInformation from '../../translation/components/shared/MoreInformation';

export interface MoreInformationProps {
  translationLocation: string | null;
}

const MoreInformation: FunctionComponent<React.PropsWithChildren<MoreInformationProps>> = ({
  translationLocation,
}) => <SharedMoreInformation translationLocation={translationLocation} />;

export default MoreInformation;
