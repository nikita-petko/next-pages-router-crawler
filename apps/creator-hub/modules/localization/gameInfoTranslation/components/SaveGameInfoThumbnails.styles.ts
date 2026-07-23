import { makeStyles } from '@rbx/ui';

const useThumbnailImageUploaderStyles = makeStyles()((theme) => ({
  saveButton: {
    marginTop: 30,
  },

  thumbnailHeader: {
    marginTop: 20,
    marginBottom: 20,
  },

  text: {
    maginTop: 5,
    marginBottom: 5,
  },

  reviewText: {
    maginTop: 5,
    marginBottom: 20,
  },

  imagePreviewContainer: {
    marginBottom: 10,
  },

  imagePreviewStyle: {
    height: '144px',
    width: '256px',
    marginRight: 10,
  },
}));

export default useThumbnailImageUploaderStyles;
