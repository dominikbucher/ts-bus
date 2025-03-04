import { EventBus, createEventDefinition } from './index';

const mockWarn = jest.fn();
console.warn = mockWarn;

describe('Basic usage', () => {
  describe('createEventDefinition', () => {
    it('should work with createEventDefinition', () => {
      const handleSubscription = jest.fn();

      // Create event and bus.
      const myEventCreator = createEventDefinition<{ foo: string }>()('myevent');
      const bus = new EventBus();
      bus.subscribe(myEventCreator, handleSubscription);

      // Create and publish an event.
      const event = myEventCreator({ foo: 'Hello' });
      bus.publish(event);
      expect(handleSubscription.mock.calls).toEqual([
        [
          {
            type: 'myevent',
            payload: { foo: 'Hello' },
          },
        ],
      ]);

      // Publish the event multiple times.
      bus.publish(event);
      bus.publish(event);
      bus.publish(event);
      expect(handleSubscription.mock.calls.length).toBe(4);
    });

    describe('createEmptyEventDefinition', () => {
      it('should work with createEmptyEventDefinition and an empty payload', () => {
        const handleSubscription = jest.fn();

        // Create event and bus.
        const myEventCreator = createEventDefinition()('myevent');
        const bus = new EventBus();
        bus.subscribe(myEventCreator, handleSubscription);

        // Create and publish an event.
        const event = myEventCreator();
        bus.publish(event);
        expect(handleSubscription.mock.calls).toEqual([
          [
            {
              type: 'myevent',
              payload: undefined,
            },
          ],
        ]);
      });
    });

    it('should allow runtime type warnings', () => {
      mockWarn.mockReset();

      const testFn = (o: any) => o.foo && typeof o.foo === 'string';
      const myEventCreator = createEventDefinition<{
        foo: string;
      }>()('myevent', testFn);

      // @ts-ignore
      myEventCreator({ ding: 'baz' });
      expect(mockWarn.mock.calls[0][0]).toEqual(`{"ding":"baz"} does not match expected payload.`);
    });

    it('should allow runtime type warnings with the options object', () => {
      mockWarn.mockReset();

      const testFn = (o: any) => o.foo && typeof o.foo === 'string';
      const myEventCreator = createEventDefinition<{
        foo: string;
      }>()('myevent', { test: testFn });

      // @ts-ignore
      myEventCreator({ ding: 'baz' });
      expect(mockWarn.mock.calls[0][0]).toEqual(`{"ding":"baz"} does not match expected payload.`);
    });

    it('should allow string coercion to return the eventType', () => {
      const myEventCreator = createEventDefinition<{
        foo: string;
      }>()('myevent');

      expect(String(myEventCreator)).toEqual('myevent');
    });
  });

  it('should respond to events being dispatched', () => {
    const handleSubscription = jest.fn();

    // Create event and bus.
    const myEventCreator = createEventDefinition<{ foo: string }>()('myevent');
    const bus = new EventBus();
    bus.subscribe(myEventCreator, handleSubscription);

    // Create and publish an event.
    const event = myEventCreator({ foo: 'Hello' });
    bus.publish(event);
    expect(handleSubscription.mock.calls).toEqual([
      [
        {
          type: 'myevent',
          payload: { foo: 'Hello' },
        },
      ],
    ]);

    // Publish the event multiple times.
    bus.publish(event);
    bus.publish(event);
    bus.publish(event);
    expect(handleSubscription.mock.calls.length).toBe(4);
  });

  describe('multi subscription', () => {
    it('should subscribe to multiple events at once', () => {
      const handleSubscription = jest.fn();

      // Create event and bus.
      const greetEvent = createEventDefinition<{ message: string }>()('greet');
      const testFooEvent = createEventDefinition<string>()('test.foo');
      const otherEvent = createEventDefinition<string>()('notsubscribed');

      const myTargetedEventType = 'test.**';
      const bus = new EventBus();
      bus.subscribe([greetEvent, myTargetedEventType], handleSubscription);

      bus.publish(greetEvent({ message: 'Hello!' })); // Should be subscribed.
      bus.publish(testFooEvent('Foo')); // Should be subscribed.
      bus.publish(otherEvent('Nope')); // Should not be subscribed.

      expect(handleSubscription.mock.calls).toMatchObject([[{ type: 'greet' }], [{ type: 'test.foo' }]]);
    });
  });

  describe('metadata', () => {
    it('should be able to send metadata', () => {
      const handleSubscription = jest.fn();

      // Create event and bus.
      const myEventCreator = createEventDefinition<{ foo: string }>()('myevent');
      const bus = new EventBus();
      bus.subscribe(myEventCreator, handleSubscription);

      // Create and publish an event.
      const event = myEventCreator({ foo: 'Hello' });
      bus.publish(event, { remote: true });
      expect(handleSubscription.mock.calls).toEqual([
        [
          {
            type: 'myevent',
            payload: { foo: 'Hello' },
            meta: { remote: true },
          },
        ],
      ]);
    });
  });

  it('should be able to append metadata', () => {
    const handleSubscription = jest.fn();

    // Create event and bus.
    const myEventCreator = createEventDefinition<{ foo: string }>()('myevent');
    const bus = new EventBus();
    bus.subscribe(myEventCreator, handleSubscription);

    // Create and publish an event.
    const event = myEventCreator({ foo: 'Hello' });
    bus.publish({ ...event, meta: { remote: false, thing: 'foo' } }, { remote: true });
    expect(handleSubscription.mock.calls).toEqual([
      [
        {
          type: 'myevent',
          payload: { foo: 'Hello' },
          meta: { remote: true, thing: 'foo' },
        },
      ],
    ]);
  });
});

describe('namespaced events', () => {
  it('should handle namespaced events', () => {
    const handleAllSubscriptions = jest.fn();
    const handleThingsSubscriptions = jest.fn();

    const createSaveEvent = createEventDefinition<string>()('things.save');
    const createEditEvent = createEventDefinition<string>()('things.edit');
    const createFrogs = createEventDefinition<string>()('frogs');

    const bus = new EventBus();
    bus.subscribe('**', handleAllSubscriptions);
    bus.subscribe('things.*', handleThingsSubscriptions);

    bus.publish(createEditEvent('Foo'));
    bus.publish(createSaveEvent('Bar'));
    bus.publish(createFrogs('Gribbit'));

    expect(handleAllSubscriptions.mock.calls).toEqual([
      [{ payload: 'Foo', type: 'things.edit' }],
      [{ payload: 'Bar', type: 'things.save' }],
      [{ payload: 'Gribbit', type: 'frogs' }],
    ]);
    expect(handleThingsSubscriptions.mock.calls).toEqual([
      [{ payload: 'Foo', type: 'things.edit' }],
      [{ payload: 'Bar', type: 'things.save' }],
    ]);
  });
});
describe('filtering by predicate', () => {
  it('should filter event subscription using a predicate function', () => {
    const handleAllSubscriptions = jest.fn();
    const handleThingsSubscriptions = jest.fn();

    const createSaveEvent = createEventDefinition<string>()('things.save' as const);
    const createEditEvent = createEventDefinition<string>()('things.edit');
    const createFrogs = createEventDefinition<string>()('frogs');
    const a = createFrogs('Gribbit');

    const bus = new EventBus();
    bus.subscribe(() => true, handleAllSubscriptions);
    bus.subscribe(({ type }) => /^things\./.test(type), handleThingsSubscriptions);

    bus.publish(createEditEvent('Foo'));
    bus.publish(createSaveEvent('Bar'));
    bus.publish(createFrogs('Gribbit'));

    expect(handleAllSubscriptions.mock.calls).toEqual([
      [{ payload: 'Foo', type: 'things.edit' }],
      [{ payload: 'Bar', type: 'things.save' }],
      [{ payload: 'Gribbit', type: 'frogs' }],
    ]);
    expect(handleThingsSubscriptions.mock.calls).toEqual([
      [{ payload: 'Foo', type: 'things.edit' }],
      [{ payload: 'Bar', type: 'things.save' }],
    ]);
  });
});

describe('unsubsubscribe from events', () => {
  it('should handle unsubscribing', () => {
    const handleSubscription = jest.fn();

    // Create event and bus.
    const myEventCreator = createEventDefinition<{ foo: string }>()('myevent');
    const bus = new EventBus();
    const unsubscribe = bus.subscribe(myEventCreator, handleSubscription);

    // Create and publish an event.
    const event = myEventCreator({ foo: 'Hello' });
    bus.publish(event);
    unsubscribe();

    // Subsequent calls should not fire.
    bus.publish(event);
    bus.publish(event);
    expect(handleSubscription.mock.calls.length).toBe(1);
  });
});
