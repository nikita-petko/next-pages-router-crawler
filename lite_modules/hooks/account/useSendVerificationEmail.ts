import { useCallback } from 'react';

import { emailClient } from '@clients/accountSettings';
import { openErrorDialog } from '@components/common/dialog/errorDialog';

/**
 * Sends a Roblox account email verification request (same API as account settings / VerifyEmailComponent).
 * @returns whether the request was accepted
 */
const useSendVerificationEmail = () => {
  const sendVerificationEmail = useCallback(async (emailAddress: string): Promise<boolean> => {
    try {
      const sendEmailResponse = await emailClient.v1EmailPostRaw({
        requestBody: {
          emailAddress,
          isAdsAccount: true,
        },
      });
      if (sendEmailResponse.raw.ok) {
        return true;
      }
      openErrorDialog();
      return false;
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message === 'challenge error of challenge kind abandoned' ||
          e.message === 'challenge error for challenge kind unknown')
      ) {
        return false;
      }
      openErrorDialog();
      return false;
    }
  }, []);

  return { sendVerificationEmail };
};

export default useSendVerificationEmail;
