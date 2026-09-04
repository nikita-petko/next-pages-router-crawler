import { ContentType } from '@rbx/client-content-licensing-api/v1';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';

/** Avatar licenses treat the applying account itself as the licensed content. */
export const toCreatorContentType = (creatorType: CreatorType): ContentType =>
  creatorType === CreatorType.Group ? ContentType.Group : ContentType.User;
