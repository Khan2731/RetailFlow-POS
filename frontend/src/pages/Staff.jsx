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
  const [shiftFilter, setShiftFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: '', shift: '', salary: '', phone: '', email: '', notes: '' });
  const [passwordData, setPasswordData] = useState({ password: '' });
  const { isAdmin } = useAuth();

  const roles = ['manager', 'waiter', 'chef', 'cashier', 'driver', 'Bar tender','Kitchen Helper'];
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
      filtered = filtered.filter((s) => [s.name, s.username, s.role, s.shift, s.phone, s.email].join(' ').toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (roleFilter) {
      filtered = filtered.filter((s) => s.role === roleFilter);
    }

    if (shiftFilter) {
      filtered = filtered.filter((s) => s.shift === shiftFilter);
    }

    setFilteredStaff(filtered);
  }, [searchTerm, roleFilter, shiftFilter, staff]);

  const fetchStaff = async () => {
    try {
      const response = await staffAPI.getAll();
      setStaff(response.data || []);
      setFilteredStaff(response.data || []);
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
        name: staffMember.name || '',
        username: staffMember.username || '',
        password: '',
        role: staffMember.role || '',
        shift: staffMember.shift || '',
        salary: staffMember.salary || '',
        phone: staffMember.phone || '',
        email: staffMember.email || '',
        notes: staffMember.notes || '',
      });
    } else {
      setEditingStaff(null);
      setFormData({ name: '', username: '', password: '', role: '', shift: '', salary: '', phone: '', email: '', notes: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStaff(null);
    setFormData({ name: '', username: '', password: '', role: '', shift: '', salary: '', phone: '', email: '', notes: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // client-side validation
    if (!formData.name || !formData.username) {
      toast.error('Name and username are required');
      return;
    }
    if (!editingStaff && (!formData.password || formData.password.length < 6)) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!formData.role || !formData.shift) {
      toast.error('Role and shift are required');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        username: formData.username,
        role: formData.role,
        shift: formData.shift,
        salary: Number(formData.salary || 0),
        phone: formData.phone,
        email: formData.email,
        notes: formData.notes,
      };

      if (!editingStaff) {
        payload.password = formData.password;
      }

      if (editingStaff) {
        await staffAPI.update(editingStaff.id, payload);
        toast.success('Staff updated successfully');
      } else {
        await staffAPI.create(payload);
        toast.success('Staff created successfully');
      }
      handleCloseDialog();
      fetchStaff();
    } catch (error) {
      console.error('Save staff error:', error);
      toast.error(error.response?.data?.error || 'Failed to save staff');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await staffAPI.delete(id);
        toast.success('Staff deleted successfully');
        fetchStaff();
      } catch (error) {
        console.error('Delete staff error:', error);
        toast.error(error.response?.data?.error || 'Failed to delete staff');
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
      console.error('Update password error:', error);
      toast.error(error.response?.data?.error || 'Failed to update password');
    }
  };

  const totalSalary = filteredStaff.reduce((sum, member) => sum + Number(member.salary || 0), 0);

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Staff Management</Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Add Staff
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField label="Search staff" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ flexGrow: 1, minWidth: 240 }} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Role</InputLabel>
          <Select value={roleFilter} label="Role" onChange={(e) => setRoleFilter(e.target.value)}>
            <MenuItem value="">All Roles</MenuItem>
            {roles.map((role) => (
              <MenuItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Shift</InputLabel>
          <Select value={shiftFilter} label="Shift" onChange={(e) => setShiftFilter(e.target.value)}>
            <MenuItem value="">All Shifts</MenuItem>
            {shifts.map((shift) => (
              <MenuItem key={shift} value={shift}>{shift.charAt(0).toUpperCase() + shift.slice(1)}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Staff Summary</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`${filteredStaff.length} staff`} color="primary" variant="outlined" />
            <Chip label={`Salary cost Rs. ${totalSalary.toFixed(2)}`} color="success" variant="outlined" />
          </Box>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Shift</TableCell>
              <TableCell>Salary</TableCell>
              <TableCell>Contact</TableCell>
              {isAdmin && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStaff.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.username}</TableCell>
                <TableCell>
                  <Chip label={member.role?.charAt(0).toUpperCase() + member.role?.slice(1)} color={roleColors[member.role] || 'default'} size="small" />
                </TableCell>
                <TableCell>{member.shift?.charAt(0).toUpperCase() + member.shift?.slice(1)}</TableCell>
                <TableCell>Rs. {Number(member.salary || 0).toFixed(2)}</TableCell>
                <TableCell>{member.phone || member.email || '—'}</TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(member)} size="small"><Edit /></IconButton>
                    <IconButton onClick={() => handleOpenPasswordDialog(member)} size="small"><Lock /></IconButton>
                    <IconButton onClick={() => handleDelete(member.id)} size="small"><Delete /></IconButton>
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
            <TextField autoFocus margin="dense" label="Full Name" fullWidth variant="outlined" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <TextField margin="dense" label="Username" fullWidth variant="outlined" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required disabled={!!editingStaff} />
            {!editingStaff && <TextField margin="dense" label="Password" type="password" fullWidth variant="outlined" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />}
            <FormControl fullWidth margin="dense" required>
              <InputLabel>Role</InputLabel>
              <Select value={formData.role} label="Role" onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                {roles.map((role) => (<MenuItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</MenuItem>))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense" required>
              <InputLabel>Shift</InputLabel>
              <Select value={formData.shift} label="Shift" onChange={(e) => setFormData({ ...formData, shift: e.target.value })}>
                {shifts.map((shift) => (<MenuItem key={shift} value={shift}>{shift.charAt(0).toUpperCase() + shift.slice(1)}</MenuItem>))}
              </Select>
            </FormControl>
            <TextField margin="dense" label="Salary" type="number" fullWidth variant="outlined" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} inputProps={{ min: 0, step: 0.01 }} />
            <TextField margin="dense" label="Phone" fullWidth variant="outlined" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            <TextField margin="dense" label="Email" type="email" fullWidth variant="outlined" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <TextField margin="dense" label="Notes" fullWidth variant="outlined" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} multiline minRows={2} />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">{editingStaff ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={passwordDialog} onClose={handleClosePasswordDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Update Password</DialogTitle>
        <form onSubmit={handlePasswordUpdate}>
          <DialogContent>
            <TextField autoFocus margin="dense" label="New Password" type="password" fullWidth variant="outlined" value={passwordData.password} onChange={(e) => setPasswordData({ password: e.target.value })} required inputProps={{ minLength: 6 }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePasswordDialog}>Cancel</Button>
            <Button type="submit" variant="contained">Update Password</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Staff;
