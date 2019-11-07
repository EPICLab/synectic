import * as React from 'react';
import UserComponent, { User } from './User';

type ListProp = {
  users: User[];
}

const UserList: React.FunctionComponent<ListProp> = (props: ListProp) => {
  return (
    <ul>
      {props.users.map((user, index) => (
        <UserComponent key={index} {...user} onClick={() => user.onClick()} />
      ))}
    </ul>
  );
};

export default UserList;