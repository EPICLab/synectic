import * as React from 'react';
import { DateTime } from 'luxon';

export type User = {
  name: string;
  modified: DateTime;
  onClick: () => void;
  selected: boolean;
}

const UserComponent: React.FunctionComponent<User> = (props: User) => {
  return (
    <li onClick={props.onClick} className='user'>
      {props.name} (last login: {props.modified.toISO()})
    </li>
  );
};

export default UserComponent;