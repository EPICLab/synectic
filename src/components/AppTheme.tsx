import { CssBaseline, PaletteMode, ThemeProvider, createTheme } from '@mui/material';
import { blue, grey } from '@mui/material/colors';
import React, { PropsWithChildren, createContext } from 'react';

type ThemeContext = { mode: PaletteMode; toggleColorMode: () => void };

export const AppThemeContext = createContext<ThemeContext>({} as ThemeContext);

export const AppThemeProvider = ({ children }: PropsWithChildren) => {
  const [mode, setMode] = React.useState<PaletteMode>('dark');
  const toggleColorMode = () => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = React.useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <AppThemeContext.Provider value={{ mode, toggleColorMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppThemeContext.Provider>
  );
};

const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // palette values for light mode
          primary: blue,
          divider: 'rgb(171, 178, 191)',
          text: {
            primary: grey[900],
            secondary: grey[800]
          }
        }
      : {
          // palette values for dark mode
          primary: blue,
          divider: 'rgb(171, 178, 191)',
          background: {
            default: 'rgb(56, 54, 57)',
            paper: 'rgba(56, 54, 57, 0.95)'
          },
          text: {
            primary: '#fff',
            secondary: 'rgba(255, 255, 255, 0.7)',
            tertiary: 'rgba(0, 0, 0, 0.54)'
          }
        })
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          padding: 0
        }
      }
    }
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"'
    ].join(',')
  }
});
