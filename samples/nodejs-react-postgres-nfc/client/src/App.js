import React from "react";
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import "./App.css";

// Import pages
import HomePage from "./pages/Home";
import EditPage from "./pages/Edit";
import CardsPage from "./pages/Cards";
import DefaultCardPage from "./pages/DefaultCardPage";
import Layout from "./components/Layout";

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      light: '#757de8',
      main: '#3f51b5',
      dark: '#002984',
      contrastText: '#fff',
    },
    secondary: {
      light: '#33eb91',
      main: '#00e676',
      dark: '#00a152',
      contrastText: '#000',
    },
    background: {
      default: '#f7f9fc',
      paper: '#ffffff',
    },
    text: {
      primary: '#172b4d',
      secondary: '#6b778c',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

function App() {
  // Add some global styles for card hover effects
  const globalStyles = {};

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box component="style" 
        dangerouslySetInnerHTML={{ 
          __html: Object.entries(globalStyles)
            .map(([selector, styles]) => 
              `${selector} { ${Object.entries(styles)
                .map(([prop, value]) => `${prop}: ${value};`)
                .join(' ')} 
              }`
            ).join('\n')
        }} 
      />
      <Router>
        <Routes>
          <Route path="/" element={<DefaultCardPage />} />
          <Route
            path="*"
            element={
              <Layout>
                <Routes>
                  <Route path="/edit" element={<EditPage />} />
                  <Route path="/edit/:cardId" element={<EditPage />} />
                  <Route path="/cards" element={<CardsPage />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;