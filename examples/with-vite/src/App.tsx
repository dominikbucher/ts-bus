import { BusProvider, EventBus, createEventDefinition, useBus, useBusReducer } from 'ts-bus';
import './App.css';

const bus = new EventBus();

const increment = createEventDefinition<void>()('increment');
const decrement = createEventDefinition<void>()('decrement');

function App() {
  const b = useBus();
  const [state] = useBusReducer(
    (state, action) => {
      switch (action.type) {
        case `${increment}`: {
          return {
            ...state,
            count: state.count + 1,
          };
        }
        case `${decrement}`: {
          return {
            ...state,
            count: state.count - 1,
          };
        }
      }
      return state;
    },
    { count: 0 }
  );

  return (
    <BusProvider value={bus}>
      <div>
        <button onClick={() => b.publish(decrement())}>-</button>
        {state.count} <button onClick={() => b.publish(increment())}>+</button>
      </div>
    </BusProvider>
  );
}

export default App;
