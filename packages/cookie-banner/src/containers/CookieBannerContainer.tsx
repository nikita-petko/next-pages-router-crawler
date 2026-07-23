import React, { useState, useCallback, useEffect } from 'react';
import CookieBanner from '../components/CookieBanner';
import { useCookieConsentContext } from '../contexts/CookieConsentContext';
import CookieDetailsModalContainer from './CookieConsentModalContainer';

const CookieBannerContainer: React.FC = () => {
  const { acceptAll, declineAll, shouldShowBanner } = useCookieConsentContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBannerOpen, setIsBannerOpen] = useState(false);

  useEffect(() => {
    if (shouldShowBanner) {
      setIsBannerOpen(true);
    }
  }, [shouldShowBanner]);

  const handleAcceptAll = useCallback(() => {
    acceptAll();
    setIsBannerOpen(false);
  }, [acceptAll]);

  const handleDeclineAll = useCallback(() => {
    declineAll();
    setIsBannerOpen(false);
  }, [declineAll]);

  const handleLearnMore = useCallback(() => {
    setIsModalOpen(true);
    setIsBannerOpen(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setIsBannerOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    setIsModalOpen(false);
    setIsBannerOpen(false);
  }, []);

  return (
    <>
      <CookieBanner
        isOpen={isBannerOpen}
        onAcceptAll={handleAcceptAll}
        onDeclineAll={handleDeclineAll}
        onLearnMore={handleLearnMore}
      />
      <CookieDetailsModalContainer
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
      />
    </>
  );
};

export default CookieBannerContainer;
