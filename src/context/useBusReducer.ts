import React, { useCallback } from 'react';
import { BusEvent, DispatchFn, EventBus, SubscribeFn, SubscriptionDef, UnsubscribeFn } from '../EventBus';
import { useBus } from './react';

export type InitFn<T> = (a: any) => T;
export type ReducerFn<S, E> = (s: S, e: E) => S;
export type UseReducerFn<T, E> = (reducer: ReducerFn<T, E>, initState: any, init: InitFn<T>) => [T, any];
function indentity<T>(a: T) {
  return a;
}

export function _defaultSubscriber<E extends BusEvent>(dispatch: DispatchFn<E>, bus: EventBus): UnsubscribeFn {
  return bus.subscribe<E>('**', dispatch);
}

export const reducerSubscriber = <E extends BusEvent>(...definition: SubscriptionDef<E>[]): SubscribeFn<E> => {
  return (dispatch: DispatchFn<any>, bus: EventBus): UnsubscribeFn => {
    return bus.subscribe(definition, dispatch);
  };
};

const useReducerCreator =
  <E extends BusEvent = BusEvent, T = any>(
    subscriber: SubscribeFn<E> = _defaultSubscriber,
    useReducer: UseReducerFn<T, E> = React.useReducer
  ) =>
  (reducer: ReducerFn<T, E>, initState: any, init: InitFn<T> = indentity) => {
    // Pull the bus from context
    const bus = useBus();

    // Run the reducer
    const [state, dispatch] = useReducer(reducer, initState, init);

    // Run the subscriber synchronously
    React.useLayoutEffect(() => subscriber(dispatch, bus), [subscriber, dispatch, bus]);

    const dispatchFn = useCallback(
      (event: BusEvent) => {
        bus.publish(event);
      },
      [bus]
    );

    return [state, dispatchFn] as [T, DispatchFn<E>];
  };

export function useBusReducer<E extends BusEvent = BusEvent, T = any>(
  reducer: ReducerFn<T, E>,
  initState: T,
  init: InitFn<T> = indentity
): [T, DispatchFn<E>] {
  const useReducerFn = useReducerCreator(_defaultSubscriber);
  return useReducerFn(reducer, initState, init);
}

type UseBusReducerOptions<E extends BusEvent, T = any> = {
  subscriber?: SubscribeFn<E>;
  useReducer?: (reducer: ReducerFn<T, E>, initState: T, init: InitFn<T>) => any;
};

useBusReducer.configure = <E extends BusEvent = BusEvent>(options: UseBusReducerOptions<E>) => {
  return useReducerCreator(options.subscriber, options.useReducer);
};
