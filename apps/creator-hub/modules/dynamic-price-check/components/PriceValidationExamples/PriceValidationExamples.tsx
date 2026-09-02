import { useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  ExpandMoreIcon,
  Button,
} from '@rbx/ui';
import ImageDisplayModal from './ImageDisplayModal';
import usePriceValidationExamplesStyles from './PriceValidationExamples.styles';

const priceCheckExampleImageLink =
  `${process.env.assetPathPrefix}/dynamic-price-check/price_check_game_example.png` as const;

const PriceValidationExamples = () => {
  const { translate } = useTranslation();

  const { classes, cx } = usePriceValidationExamplesStyles();

  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);

  const handleAccordionCollapse = () => {
    setIsAccordionOpen(!isAccordionOpen);
  };

  const handleOpenImageModal = () => {
    setIsImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
  };

  return (
    <div>
      <Accordion
        variant='outlined'
        expanded={isAccordionOpen}
        onChange={handleAccordionCollapse}
        disableGutters
        className={classes.accordion}>
        <AccordionSummary className={classes.accordionSummary} expandIcon={false}>
          <ExpandMoreIcon
            className={cx(classes.accordionAction, { [classes.iconTransition]: isAccordionOpen })}
            color='primary'
          />
          <Typography variant='body1' component='p' className={classes.accordionAction}>
            {translate('Action.ViewExamples')}
          </Typography>
        </AccordionSummary>

        <AccordionDetails>
          <div className={classes.examples}>
            <div>
              <Typography variant='body1' component='p'>
                {translate('Description.ScriptExamples')}
              </Typography>
            </div>

            <div className={classes.codeBlock}>
              <Typography variant='body2' component='p' className={classes.comment}>
                {'\u002F\u002F'} Good example
              </Typography>
              <Typography variant='body2' component='p' className={classes.code}>
                client_script.lua
              </Typography>
              <br />
              <Typography variant='body2' component='p' className={classes.code}>
                <span className={classes.variable}>local</span>
                <span> productInfo = MarketplaceService:GetProductInfo(</span>
                <span className={classes.parameter}>PRODUCT_ID</span>
                <span>) </span>
                <span className={classes.comment}>
                  {'\u002F\u002F'} User details included in header
                </span>
              </Typography>
              <Typography variant='body2' component='p' className={classes.code}>
                <span className={classes.variable}>local</span>
                <span> price = productInfo.PriceInRobux</span>
              </Typography>
            </div>

            <div className={classes.codeBlock}>
              <Typography variant='body2' component='p' className={classes.comment}>
                {'\u002F\u002F'} Bad example
              </Typography>
              <Typography variant='body2' component='p' className={classes.code}>
                <span className={classes.variable}>local</span>
                <span> price = </span>
                <span className={classes.value}>
                  {'\u0022'}500 robux{'\u0022'}
                </span>
                <span className={classes.comment}> {'\u002F\u002F \u2190'} hard-coded price</span>
              </Typography>
              <br />
              <Typography variant='body2' component='p' className={classes.comment}>
                <span>{'\u002F\u002F'} Bad example #2</span>
              </Typography>
              <Typography variant='body2' component='p' className={classes.code}>
                <span>server_script.lua </span>
                <span className={classes.comment}>
                  {'\u002F\u002F \u2190'} Not a client side script
                </span>
              </Typography>
              <br />
              <Typography variant='body2' component='p' className={classes.code}>
                <span className={classes.variable}>local</span>
                <span> productInfo = MarketplaceService:GetProductInfo(</span>
                <span className={classes.parameter}>PRODUCT_ID</span>
                <span>) </span>
                <span className={classes.comment}>
                  {'\u002F\u002F'} No user details included in header
                </span>
              </Typography>
              <Typography variant='body2' component='p' className={classes.code}>
                <span className={classes.variable}>local</span>
                <span> price = productInfo.PriceInRobux</span>
              </Typography>
            </div>
            <div>
              <Typography variant='body1' component='p'>
                {translate('Description.GameExamples')}
              </Typography>
            </div>
            <div className={classes.imageContainer}>
              <Button onClick={handleOpenImageModal} className={classes.imageButton}>
                <img
                  className={classes.croppedImage}
                  alt='game example'
                  src={priceCheckExampleImageLink}
                />
              </Button>
            </div>
            <div>
              <Button
                size='small'
                className={classes.viewImageButton}
                onClick={handleOpenImageModal}>
                {translate('Action.ViewImage')}
              </Button>
            </div>
            <ImageDisplayModal
              imageAlt='game example'
              imageLink={priceCheckExampleImageLink}
              headingText={translate('Heading.ImageExampleModal')}
              descriptionText={translate('Description.ImageExampleModal')}
              isOpen={isImageModalOpen}
              onClose={handleCloseImageModal}
            />
          </div>
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export default PriceValidationExamples;
