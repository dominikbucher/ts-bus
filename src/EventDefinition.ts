export type PredicateFn<T> = (event: T) => boolean;

export type EventTypeDescriptor<T extends { type: string }> = {
  eventType: T['type'];
};

export type EventCreatorFn<T extends { type: string; payload: any }> = ((payload: T['payload']) => T) &
  EventTypeDescriptor<T>;

const showWarning = (msg: string): void => {
  if (process?.env?.NODE_ENV !== 'production') {
    console.warn(msg);
  }
};

const isEventDescriptor = <T extends { type: string }>(descriptor: any): descriptor is EventTypeDescriptor<T> =>
  !!descriptor?.eventType;

export const isPredicateFn = <T>(descriptor: any): descriptor is PredicateFn<T> =>
  !isEventDescriptor(descriptor) && typeof descriptor === 'function';

export const getEventType = (descriptor: string | EventTypeDescriptor<any>): string => {
  if (isEventDescriptor(descriptor)) return descriptor.eventType;
  return descriptor as string;
};

export const filter = <T>(predicate: PredicateFn<T>, handler: (a: any) => void) => {
  return (event: any) => {
    if (predicate(event)) return handler(event);
  };
};

type TestPredicateFn<P> = (payload: P) => boolean;

type EventDefinitionOptions<P> = {
  test?: (payload: P) => boolean;
};

export const createEventDefinition = <P extends any = void>() => {
  return <const T extends string>(type: T, options?: EventDefinitionOptions<P> | TestPredicateFn<P>) => {
    const eventCreator = (payload: P) => {
      if (options && payload) {
        const testFn = typeof options === 'function' ? options : options.test;
        if (testFn && !testFn(payload)) {
          showWarning(`${JSON.stringify(payload)} does not match expected payload.`);
        }
      }
      return { type, payload };
    };
    eventCreator.eventType = type;
    eventCreator.toString = () => type;
    return eventCreator;
  };
};
