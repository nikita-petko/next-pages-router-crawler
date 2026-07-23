import { useContext } from 'react';
import verificationMetadataContext from './VerificationMetadataContext';

export default function useVerificationMetadata() {
  return useContext(verificationMetadataContext);
}
