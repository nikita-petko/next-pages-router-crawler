import { StatusCodes } from '@rbx/core';

interface ErrorText {
  headingKey: string;
  descriptionKey: string;
}

export type ErrorCode = StatusCodes.BAD_REQUEST | StatusCodes.NOT_FOUND | StatusCodes.FORBIDDEN;

export const errorCodeKeyDictionary: Record<ErrorCode, ErrorText> = {
  400: {
    headingKey: 'Heading.BadRequest',
    descriptionKey: 'Description.BadRequest',
  },
  404: {
    headingKey: 'Heading.PageNotFound',
    descriptionKey: 'Description.PageNotFound',
  },
  403: {
    headingKey: 'Heading.AccessDenied',
    descriptionKey: 'Description.AccessDenied',
  },
};
