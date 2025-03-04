import { EventEmitter2 as EventEmitter } from 'eventemitter2';
import { EventCreatorFn, filter, getEventType, isPredicateFn, PredicateFn } from './EventDefinition';

export type BusEvent<T extends object = any> = {
  type: string;
  payload: T;
  meta?: any;
};

export type DispatchFn<E> = (a: E) => void;

export type UnsubscribeFn = () => any;

export type SubscribeFn<E extends BusEvent> = (dispatch: DispatchFn<E>, bus: EventBus) => UnsubscribeFn;

export type SubscriptionDef<T extends BusEvent> = string | EventCreatorFn<T> | PredicateFn<T> | T['type'];

export type SubscribeWithPayloadDispatchFn<E extends BusEvent> = (
  dispatch: DispatchFn<E['payload']>,
  bus: EventBus
) => UnsubscribeFn;

export class EventBus {
  /** Internal emitter instance. */
  emitter = new EventEmitter({ wildcard: true });

  /** Publish an event to the bus. */
  publish<T extends BusEvent>(event: T, meta?: any): void {
    this.emitter.emit(event.type, meta ? { ...event, meta: { ...event.meta, ...meta } } : event);
  }

  /** Subscribe using a string event identifier. */
  subscribe<T extends BusEvent>(subscription: string, handler: (e: BusEvent) => void): () => void;
  /** Subscribe using an event creator function. */
  subscribe<T extends BusEvent>(
    subscription: EventCreatorFn<T>,
    handler: (e: ReturnType<typeof subscription>) => void
  ): () => void;
  /** Subscribe using a predicate function. */
  subscribe<T extends BusEvent>(subscription: PredicateFn<T>, handler: (e: T) => void): () => void;
  /** Subscribe using a subscription definition. */
  subscribe<T extends { type: string }>(subscription: T['type'], handler: (e: T) => void): () => void;

  /** Implementation of subscribe function. */
  subscribe<T extends BusEvent>(
    subscription: SubscriptionDef<T> | SubscriptionDef<T>[],
    handler: (e: T) => void
  ): () => void {
    const subscribeToSubdef = (subdef: SubscriptionDef<T>) => {
      if (isPredicateFn<T>(subdef)) {
        const filteredHandler = filter(subdef, handler);
        this.emitter.on('**', filteredHandler);
        return () => this.emitter.off('**', filteredHandler);
      }
      const type = getEventType(subdef);
      this.emitter.on(type, handler);
      return () => this.emitter.off(type, handler);
    };

    const subs = Array.isArray(subscription) ? subscription : [subscription];
    const unsubscribers = subs.map(subscribeToSubdef);
    return () => unsubscribers.forEach((u) => u());
  }
}
