import React from 'react';
import { IconButton, Tooltip, useTheme as useMuiTheme } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';

const ThemeToggleButton: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();

  return (
    <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        sx={{
          ml: 1,
          backgroundColor: muiTheme.palette.action.hover,
          '&:hover': {
            backgroundColor: muiTheme.palette.action.selected,
          },
          transition: 'all 0.3s ease',
        }}
      >
        {isDarkMode ? (
          <Brightness7 
            sx={{ 
              color: '#FCD34D',
              animation: 'fadeIn 0.3s ease-in-out',
            }} 
          />
        ) : (
          <Brightness4 
            sx={{ 
              color: '#1E293B',
              animation: 'fadeIn 0.3s ease-in-out',
            }} 
          />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggleButton;
