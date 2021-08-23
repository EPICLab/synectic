import React from 'react';
import MenuItem from '@material-ui/core/MenuItem';

export type NavItemProps = {
  label: string;
  disabled?: boolean;
  click: (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
}

export const NavItem: React.FunctionComponent<NavItemProps> = ({ label, click, disabled }) => {
  return (
    <MenuItem onClick={click} disabled={disabled}>{label}</ MenuItem>
  );
}