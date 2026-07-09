import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Edit, Delete, Add, Lock } from '@mui/icons-material';
import { staffAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: '', shift: '' });
  const [passwordData, setPasswordData] = useState({ password: '' });
  const { isAdmin } = useAuth();

  const roles = ['manager', 'waiter', 'chef', 'cashier', 'driver'];
  const shifts = ['morning', 'evening'];

  const roleColors = {
    manager: 'error',
    waiter: 'primary',
    chef: 'warning',
    cashier: 'info',
    driver: 'success',
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    let filtered = staff;
    
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (roleFilter) {
      filtered = filtered.filter(s => s.role === roleFilter);
    }
    
    setFilteredStaff(filtered);
  }, [searchTerm, roleFilter, staff]);

  const fetchStaff = async () => {
    try {
      const response = await staffAPI.getAll();
      setStaff(response.data);
      setFilteredStaff(response.data);
    } catch (error) {
      toast.error('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (staffMember = null) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({
        name: staffMember.name,
        username: staffMember.username,
        password: '',
        role: staffMember.role,
        shift: staffMember.shift,
      });
    } else {
      setEditingStaff(null);
      setFormData({ name: '', username: '', password: '', role: '', shift: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStaff(null);
    setFormData({ name: '', username: '', password: '', role: '', shift: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingStaff) {
        await staffAPI.update(editingStaff.id, {
          name: formData.name,
          username: formData.username,
          role: formData.role,
          shift: formData.shift,
        });
        toast.success('Staff updated successfully');
      } else {
        await staffAPI.create(formData);
        toast.success('Staff created successfully');
      }
      handleCloseDialog();
      fetchStaff();
    } catch (error) {
      toast.error('Failed to save staff');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await staffAPI.delete(id);
        toast.success('Staff deleted successfully');
        fetchStaff();
      } catch (error) {
        toast.error('Failed to delete staff');
      }
    }
  };

  const handleOpenPasswordDialog = (staffMember) => {
    setEditingStaff(staffMember);
    setPasswordData({ password: '' });
    setPasswordDialog(true);
  };

  const handleClosePasswordDialog = () => {
    setPasswordDialog(false);
    setEditingStaff(null);
    setPasswordData({ password: '' });
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    try {
      await staffAPI.updatePassword(editingStaff.id, passwordData.password);
      toast.success('Password updated successfully');
      handleClosePasswordDialog();
    } catch (error) {
      toast.error('Failed to update password');
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 }, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Staff Management</Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Staff
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Search staff"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={roleFilter}
            label="Role"
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="">All Roles</MenuItem>
            {roles.map((role) => (
              <MenuItem key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Shift</TableCell>
              {isAdmin && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStaff.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.username}</TableCell>
                <TableCell>
                  <Chip
                    label={member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    color={roleColors[member.role] || 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{member.shift.charAt(0).toUpperCase() + member.shift.slice(1)}</TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(member)} size="small">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleOpenPasswordDialog(member)} size="small">
                      <Lock />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(member.id)} size="small">
                      <Delete />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingStaff ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Full Name"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              label="Username"
              fullWidth
              variant="outlined"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={!!editingStaff}
            />
            {!editingStaff && (
              <TextField
                margin="dense"
                label="Password"
                type="password"
                fullWidth
                variant="outlined"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            )}
            <FormControl fullWidth margin="dense" required>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {roles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense" required>
              <InputLabel>Shift</InputLabel>
              <Select
                value={formData.shift}
                label="Shift"
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
              >
                {shifts.map((shift) => (
                  <MenuItem key={shift} value={shift}>
                    {shift.charAt(0).toUpperCase() + shift.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingStaff ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={passwordDialog} onClose={handleClosePasswordDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Update Password</DialogTitle>
        <form onSubmit={handlePasswordUpdate}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="New Password"
              type="password"
              fullWidth
              variant="outlined"
              value={passwordData.password}
              onChange={(e) => setPasswordData({ password: e.target.value })}
              required
              inputProps={{ minLength: 6 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePasswordDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Update Password
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Staff;
