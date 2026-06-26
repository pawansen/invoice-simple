import { createTheme } from '@mui/material/styles';

/**
 * Simple, professional theme. Deliberately restrained: a single primary colour,
 * comfortable spacing and slightly rounded surfaces. The goal is clarity, not
 * visual flourish.
 */
export const theme = createTheme({
  palette: {
    primary: { main: '#1565c0' },
    secondary: { main: '#37474f' },
    background: { default: '#f4f6f8' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});
