export type ColorSet = {
  primary: string;
  secondary: string;
};

// colors from http://clrs.cc/
export const colorSets: { [color: string]: ColorSet } = {
  navy: { primary: '#001f3f', secondary: '#80b5ff' },
  blue: { primary: '#0074d9', secondary: '#b3dbff' },
  aqua: { primary: '#7fdbff', secondary: '#004966' },
  teal: { primary: '#39cccc', secondary: '#000000' },
  olive: { primary: '#3d9970', secondary: '#163728' },
  green: { primary: '#2ecc40', secondary: '#0e3e14' },
  lime: { primary: '#01ff70', secondary: '#00662c' },
  yellow: { primary: '#ffdc00', secondary: '#665800' },
  orange: { primary: '#ff851b', secondary: '#663000' },
  red: { primary: '#ff4136', secondary: '#800600' },
  maroon: { primary: '#85144b', secondary: '#eb7ab1' },
  fuchsia: { primary: '#f012be', secondary: '#65064f' },
  purple: { primary: '#b10dc9', secondary: '#efa9f9' },
  black: { primary: '#111111', secondary: '#dddddd' },
  gray: { primary: '#aaaaaa', secondary: '#000000' },
  silver: { primary: '#dddddd', secondary: '#000000' },
  white: { primary: '#ffffff', secondary: '#444444' },
  conflictRed: { primary: '#da6473', secondary: '' },
  stagedBlue: { primary: '#61aeee', secondary: '' },
  unstagedOrange: { primary: '#d19a66', secondary: '' },
  nominalGreen: { primary: '#50c878', secondary: '' }
};

export const getColor = (color: keyof typeof colorSets): ColorSet => {
  return colorSets[color];
};
