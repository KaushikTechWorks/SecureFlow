import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FeedbackIcon from '@mui/icons-material/Feedback';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const Navbar: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/', icon: <HomeIcon /> },
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Batch Upload', path: '/batch', icon: <CloudUploadIcon /> },
    { label: 'Feedback', path: '/feedback', icon: <FeedbackIcon /> },
  ];

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (event.type === 'keydown' && 
        ((event as React.KeyboardEvent).key === 'Tab' || 
         (event as React.KeyboardEvent).key === 'Shift')
       ) {
      return;
    }
    setDrawerOpen(open);
  };

  const drawer = (
    <Box
      sx={{ width: 280, pt: 2 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pb: 2 }}>
        <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" color="primary" sx={{ flexGrow: 1, fontWeight: 600 }}>
          SecureFlow
        </Typography>
        <IconButton onClick={toggleDrawer(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {navItems.map((item) => (
          <Box
            key={item.path}
            sx={{
              borderRadius: 2,
              mx: 1,
              mb: 1,
              bgcolor: location.pathname === item.path ? 'primary.light' : 'transparent',
              color: location.pathname === item.path ? 'primary.contrastText' : 'text.primary',
              '&:hover': {
                bgcolor: location.pathname === item.path ? 'primary.light' : 'rgba(0,0,0,0.04)',
              }
            }}
          >
            <Button
              component={RouterLink}
              to={item.path}
              fullWidth
              sx={{
                justifyContent: 'flex-start',
                py: 1,
                color: 'inherit',
                textAlign: 'left'
              }}
              startIcon={
                <Box component="span" sx={{ color: location.pathname === item.path ? 'inherit' : 'primary.main' }}>
                  {item.icon}
                </Box>
              }
            >
              {item.label}
            </Button>
          </Box>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar position="sticky" color="default" sx={{ backgroundColor: 'background.paper' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <SecurityIcon sx={{ mr: 1, color: 'primary.main', display: { xs: 'none', md: 'flex' } }} />
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              color: 'primary.main',
              textDecoration: 'none',
              letterSpacing: '.1rem',
            }}
          >
            SECUREFLOW
          </Typography>

          {isMobile ? (
            <>
              <Box sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1, alignItems: 'center' }}>
                <IconButton
                  size="large"
                  edge="start"
                  color="primary"
                  aria-label="menu"
                  onClick={toggleDrawer(true)}
                >
                  <MenuIcon />
                </IconButton>
                <Typography
                  variant="h6"
                  noWrap
                  component={RouterLink}
                  to="/"
                  sx={{
                    flexGrow: 1,
                    fontWeight: 700,
                    color: 'primary.main',
                    textDecoration: 'none',
                  }}
                >
                  SECUREFLOW
                </Typography>
              </Box>
              <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
                {drawer}
              </Drawer>
            </>
          ) : (
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    mx: 1,
                    color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                    borderBottom: location.pathname === item.path ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                    borderRadius: 0,
                    '&:hover': {
                      backgroundColor: 'transparent',
                      borderBottom: `3px solid ${theme.palette.primary.light}`,
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
