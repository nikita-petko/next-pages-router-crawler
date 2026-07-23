import { useQuery } from '@tanstack/react-query';
import { createImage } from '../../hooks/document';

const useSubmitImage = (img: File | undefined) => {
  return useQuery({
    queryKey: [img?.size, img?.type, img?.name, img?.lastModified],
    queryFn: async () => {
      if (!img) {
        return undefined;
      }
      const id = await createImage(img);
      return {
        imageId: id,
        imageBlob: img,
      };
    },
    enabled: !!img,
  });
};
export default useSubmitImage;
