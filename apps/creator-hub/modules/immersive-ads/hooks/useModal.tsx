import { useState, useCallback, ReactNode } from 'react';

interface UseModalResult {
  isModalOpen: boolean;
  modalContent: ReactNode | null;
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
}

const useModal = (): UseModalResult => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);

  const openModal = useCallback((content: ReactNode) => {
    setModalContent(content);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalContent(null); // Clear content when closing
  }, []);

  return {
    isModalOpen,
    modalContent,
    openModal,
    closeModal,
  };
};

export default useModal;
