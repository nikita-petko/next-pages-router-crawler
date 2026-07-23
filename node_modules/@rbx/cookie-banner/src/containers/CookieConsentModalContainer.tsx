import React, { useCallback, useState } from 'react';
import CookieConsentModal from '../components/CookieConsentModal';
import { useCookieConsentContext } from '../contexts/CookieConsentContext';

interface CookieConsentModalContainerProps {
  isOpen: boolean;
  onSave: () => void;
  onClose: () => void;
}

const CookieConsentModalContainer: React.FC<CookieConsentModalContainerProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const { cookiePolicy, acceptAll, declineAll, hasAcceptedAnalyticsCookie } =
    useCookieConsentContext();
  const [isAnalyticsCookieAccepted, setIsAnalyticsCookieAccepted] = useState<boolean>(
    hasAcceptedAnalyticsCookie,
  );

  const handleSave = useCallback(() => {
    if (isAnalyticsCookieAccepted) {
      acceptAll();
    } else {
      declineAll();
    }
    onSave();
  }, [acceptAll, declineAll, isAnalyticsCookieAccepted, onSave]);

  if (!cookiePolicy) {
    return null;
  }

  return (
    <CookieConsentModal
      open={isOpen}
      onClose={onClose}
      isAnalyticsCookieAccepted={isAnalyticsCookieAccepted}
      setIsAnalyticsCookieAccepted={setIsAnalyticsCookieAccepted}
      onSave={handleSave}
    />
  );
};

export default CookieConsentModalContainer;
