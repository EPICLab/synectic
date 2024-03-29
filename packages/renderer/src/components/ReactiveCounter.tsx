import {useState} from 'react';

const ReactiveCounter = () => {
  const [count, setCount] = useState(0);

  const increase = () => setCount(count + 1);

  return (
    <button
      onClick={increase}
      aria-label="reactive-counter"
    >
      {' '}
      count is: {count}
    </button>
  );
};

export default ReactiveCounter;
