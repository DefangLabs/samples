import React from "react";
import { ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, Typography } from '@mui/material';
import "./App.css";
import CardCreator from "./components/CardCreator/CardCreator";

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#000000',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" color="primary">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Card Creator
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ py: 4 }}>
          <CardCreator />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;