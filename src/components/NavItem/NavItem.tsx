import React from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import { removeNullableProperties } from '../../containers/utils';

export type NavItemProps = {
  label: string;
  disabled?: boolean;
  click: (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
};

const NavItem = ({ label, click, disabled }: NavItemProps) => {
  return (
    <MenuItem onClick={click} {...removeNullableProperties({ disabled: disabled })}>
      {label}
    </MenuItem>
  );
};

export default NavItem;
