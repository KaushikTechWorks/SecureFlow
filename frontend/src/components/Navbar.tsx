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
  useMediaQuery,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FeedbackIcon from '@mui/icons-material/Feedback';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ThemeToggleButton from './ThemeToggleButton';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { userEmail, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const navItems = [
    { label: 'Home', path: '/home', icon: <HomeIcon /> },
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

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleMenuClose();
  };

  const getUserInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ThemeToggleButton />
                  <IconButton
                    onClick={handleMenuClick}
                    sx={{ 
                      color: 'text.primary',
                      border: `2px solid ${theme.palette.primary.main}`,
                    }}
                  >
                    <Avatar sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: theme.palette.primary.main,
                      fontSize: '0.875rem',
                    }}>
                      {userEmail ? getUserInitials(userEmail) : 'U'}
                    </Avatar>
                  </IconButton>
                </Box>
              </Box>
              <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
                {drawer}
              </Drawer>
            </>
          ) : (
            <>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ThemeToggleButton />
                <IconButton
                  onClick={handleMenuClick}
                  sx={{ 
                    color: 'text.primary',
                    border: `2px solid ${theme.palette.primary.main}`,
                  }}
                >
                  <Avatar sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: theme.palette.primary.main,
                  }}>
                    {userEmail ? getUserInitials(userEmail) : 'U'}
                  </Avatar>
                </IconButton>
              </Box>
            </>
          )}
        </Toolbar>
      </Container>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            mt: 1,
            minWidth: 200,
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Signed in as
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {userEmail || 'User'}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <AccountCircleIcon />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Navbar;
