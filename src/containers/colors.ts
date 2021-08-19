export type ColorSet = {
  name: string,
  primary: string,
  secondary: string
}

// colors from http://clrs.cc/
export const colorSets: Array<ColorSet> = [
  { name: 'navy', primary: '#001f3f', secondary: '#80b5ff' },
  { name: 'blue', primary: '#0074d9', secondary: '#b3dbff' },
  { name: 'aqua', primary: '#7fdbff', secondary: '#004966' },
  { name: 'teal', primary: '#39cccc', secondary: '#000000' },
  { name: 'olive', primary: '#3d9970', secondary: '#163728' },
  { name: 'green', primary: '#2ecc40', secondary: '#0e3e14' },
  { name: 'lime', primary: '#01ff70', secondary: '#00662c' },
  { name: 'yellow', primary: '#ffdc00', secondary: '#665800' },
  { name: 'orange', primary: '#ff851b', secondary: '#663000' },
  { name: 'red', primary: '#ff4136', secondary: '#800600' },
  { name: 'maroon', primary: '#85144b', secondary: '#eb7ab1' },
  { name: 'fuchsia', primary: '#f012be', secondary: '#65064f' },
  { name: 'purple', primary: '#b10dc9', secondary: '#efa9f9' },
  { name: 'black', primary: '#111111', secondary: '#dddddd' },
  { name: 'gray', primary: '#aaaaaa', secondary: '#000000' },
  { name: 'silver', primary: '#dddddd', secondary: '#000000' },
  { name: 'white', primary: '#ffffff', secondary: '#444444' }
]