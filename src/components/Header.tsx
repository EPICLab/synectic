import React from 'react';

type HeaderProps = {
  title: string;
}

const Header: React.FunctionComponent<HeaderProps> = props => {
  return (
    <div className='card-header'>{props.title}{props.children}</div>
  );
}

export default Header;