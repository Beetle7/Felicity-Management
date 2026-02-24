import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [pwdData, setPwdData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/profile`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setUser(res.data);
            setFormData(res.data);
        } catch (err) { console.error(err); }
    };

    const handleSave = async () => {
        try {
            const endpoint = user.role === 'Organizer' ? '/profile/organizer' : '/profile/participant';
            const payload = user.role === 'Participant'
                ? { firstName: formData.firstName, lastName: formData.lastName, contactNumber: formData.contactNumber, collegeName: formData.collegeName, interests: formData.interests }
                : { organizerName: formData.organizerName, category: formData.category, description: formData.description, contactEmail: formData.contactEmail, contactNumber: formData.contactNumber };

            await axios.put(`${API_URL}/api${endpoint}`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert('Profile updated');
            setEditing(false);
            fetchProfile();
        } catch (err) { alert(err.response?.data?.message || 'Update failed'); }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (pwdData.newPassword !== pwdData.confirmPassword) { alert('Passwords do not match'); return; }
        try {
            await axios.put(`${API_URL}/api/profile/password`,
                { currentPassword: pwdData.currentPassword, newPassword: pwdData.newPassword },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            alert('Password changed');
            setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) { alert(err.response?.data?.message || 'Password change failed'); }
    };

    if (!user) return <p>Loading...</p>;

    return (
        <div>
            <h1>Profile</h1>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>

            {user.role === 'Participant' && !editing && (
                <div>
                    <p>First Name: {user.firstName}</p>
                    <p>Last Name: {user.lastName}</p>
                    <p>Contact: {user.contactNumber}</p>
                    <p>College: {user.collegeName}</p>
                    <p>Type: {user.participantType}</p>
                    <p>Interests: {(user.interests || []).join(', ') || 'None'}</p>
                    <p>Following: {(user.followedClubs || []).map(c => c.organizerName || c).join(', ') || 'None'}</p>
                    <button onClick={() => setEditing(true)}>Edit</button>
                </div>
            )}

            {user.role === 'Participant' && editing && (
                <div>
                    <label>First Name: <input value={formData.firstName || ''} onChange={e => setFormData({ ...formData, firstName: e.target.value })} /></label><br />
                    <label>Last Name: <input value={formData.lastName || ''} onChange={e => setFormData({ ...formData, lastName: e.target.value })} /></label><br />
                    <label>Contact: <input value={formData.contactNumber || ''} onChange={e => setFormData({ ...formData, contactNumber: e.target.value })} /></label><br />
                    <label>College: <input value={formData.collegeName || ''} onChange={e => setFormData({ ...formData, collegeName: e.target.value })} /></label><br />
                    <label>Interests (comma-separated): <input value={(formData.interests || []).join(', ')} onChange={e => setFormData({ ...formData, interests: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></label><br />
                    <button onClick={handleSave}>Save</button>
                    <button onClick={() => { setEditing(false); setFormData(user); }}>Cancel</button>
                </div>
            )}

            {user.role === 'Organizer' && !editing && (
                <div>
                    <p>Organization: {user.organizerName}</p>
                    <p>Category: {user.category}</p>
                    <p>Description: {user.description}</p>
                    <p>Contact Email: {user.contactEmail || 'Not set'}</p>
                    <p>Contact Number: {user.contactNumber || 'Not set'}</p>
                    <button onClick={() => setEditing(true)}>Edit</button>
                </div>
            )}

            {user.role === 'Organizer' && editing && (
                <div>
                    <label>Organization Name: <input value={formData.organizerName || ''} onChange={e => setFormData({ ...formData, organizerName: e.target.value })} /></label><br />
                    <label>Category: <input value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} /></label><br />
                    <label>Description: <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} /></label><br />
                    <label>Contact Email: <input value={formData.contactEmail || ''} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} /></label><br />
                    <label>Contact Number: <input value={formData.contactNumber || ''} onChange={e => setFormData({ ...formData, contactNumber: e.target.value })} /></label><br />
                    <button onClick={handleSave}>Save</button>
                    <button onClick={() => { setEditing(false); setFormData(user); }}>Cancel</button>
                </div>
            )}

            <hr />
            {user.role === 'Participant' && (
                <>
                    <h3>Change Password</h3>
                    <form onSubmit={handlePasswordChange}>
                        <input type="password" placeholder="Current Password" value={pwdData.currentPassword} onChange={e => setPwdData({ ...pwdData, currentPassword: e.target.value })} required /><br />
                        <input type="password" placeholder="New Password" value={pwdData.newPassword} onChange={e => setPwdData({ ...pwdData, newPassword: e.target.value })} required /><br />
                        <input type="password" placeholder="Confirm New Password" value={pwdData.confirmPassword} onChange={e => setPwdData({ ...pwdData, confirmPassword: e.target.value })} required /><br />
                        <button type="submit">Change Password</button>
                    </form>
                </>
            )}

            {user.role === 'Organizer' && (
                <PasswordResetSection />
            )}
        </div>
    );
};

const PasswordResetSection = () => {
    const [reason, setReason] = React.useState('');
    const [requests, setRequests] = React.useState([]);
    const axios = require('axios');
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    React.useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/password-reset/my-requests`, { headers });
            setRequests(res.data);
        } catch (err) { console.error(err); }
    };

    const handleRequest = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/password-reset/request`, { reason }, { headers });
            alert('Password reset request submitted to Admin');
            setReason('');
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.message || 'Request failed');
        }
    };

    return (
        <div>
            <h3>Request Password Reset</h3>
            <p>Submit a request to the Admin to reset your password.</p>
            <form onSubmit={handleRequest}>
                <textarea placeholder="Reason for password reset..." value={reason} onChange={e => setReason(e.target.value)} required />
                <br />
                <button type="submit">Submit Request</button>
            </form>

            {requests.length > 0 && (
                <div>
                    <h4>Request History</h4>
                    <table>
                        <thead><tr><th>Date</th><th>Reason</th><th>Status</th><th>Admin Comments</th></tr></thead>
                        <tbody>
                            {requests.map(r => (
                                <tr key={r._id}>
                                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                                    <td>{r.reason}</td>
                                    <td>{r.status}</td>
                                    <td>{r.adminComments || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Profile;
