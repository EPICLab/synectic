import {useState} from 'react';
import {sha256sum} from '#preload';

const ReactiveHash = () => {
  const [rawString, setRawString] = useState('Hello World');
  const hashedString = sha256sum(rawString);

  return (
    <table>
      <tbody>
        <tr>
          <th>
            <label htmlFor="reactive-hash-raw-value">Raw value :</label>
          </th>
          <td>
            <input
              type="text"
              id="reactive-hash-raw-value"
              value={rawString}
              onChange={e => setRawString(e.target.value)}
            />
          </td>
        </tr>

        <tr>
          <th>
            <label htmlFor="reactive-hash-hashed-value">Hashed by node:crypto :</label>
          </th>
          <td>
            <input
              type="text"
              id="reactive-hash-hashed-value"
              value={hashedString}
              readOnly
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default ReactiveHash;
