import { TTag } from '../core/types';
import BaseEvent, { TBaseEventParams, TFieldName, TFieldValue } from './BaseEvent';

export type TTaggableEventParams = TBaseEventParams & { tags?: TTag[] };
export default class TaggableEvent extends BaseEvent {
  private tags: TTag[] = [];

  constructor({
    product,
    url,
    eventName,
    parameters,
    source,
    tags,
    sessionId,
  }: TTaggableEventParams) {
    super({ product, url, eventName, parameters, source, sessionId });
    this.tags = tags || [];
  }

  toLogEventObject(): Record<TFieldName, TFieldValue> {
    return {
      ...super.toLogEventObject(),
      tags: this.tags && this.tags.length > 0 ? this.tags.toString() : undefined,
    };
  }

  addTag(tag: TTag): void {
    this.tags.push(tag);
  }
}
