import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

const AdminBoard = () => {
    const [orgData, setOrgData] = useState({
        organizerName: '',
        email: '',
        password: '',
        category: '',
        description: ''
    });
    const [organizers, setOrganizers] = useState([]);
    const [resetRequests, setResetRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('organizers');
    const [adminComments, setAdminComments] = useState({});
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchOrganizers();
        fetchResetRequests();
    }, []);

    const fetchOrganizers = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/admin/organizers`, { headers });
            setOrganizers(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchResetRequests = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/password-reset/requests`, { headers });
            setResetRequests(res.data);
        } catch (err) { console.error(err); }
    };

    const handleCreateOrg = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/api/admin/organizer`, orgData, { headers });
            alert(res.data.message);
            fetchOrganizers();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create organizer");
        }
    };

    const handleDisable = async (orgId) => {
        if (!window.confirm("Disable this organizer?")) return;
        try {
            await axios.delete(`${API_URL}/api/admin/organizer/${orgId}`, { headers });
            alert('Organizer disabled');
            fetchOrganizers();
        } catch (err) { alert('Failed'); }
    };

    const handleDelete = async (orgId) => {
        if (!window.confirm("Permanently delete this organizer and all their events/registrations?")) return;
        try {
            await axios.delete(`${API_URL}/api/admin/organizer/${orgId}?action=delete`, { headers });
            alert('Permanently deleted');
            fetchOrganizers();
        } catch (err) { alert('Failed'); }
    };

    const handleApproveReset = async (requestId) => {
        try {
            const res = await axios.put(`${API_URL}/api/password-reset/${requestId}/approve`,
                { comments: adminComments[requestId] || '' }, { headers });
            alert(`Password reset approved! New password: ${res.data.newPassword}\n\nShare this with the organizer.`);
            setAdminComments({ ...adminComments, [requestId]: '' });
            fetchResetRequests();
        } catch (err) {
            alert(err.response?.data?.message || 'Approval failed');
        }
    };

    const handleRejectReset = async (requestId) => {
        try {
            await axios.put(`${API_URL}/api/password-reset/${requestId}/reject`,
                { comments: adminComments[requestId] || '' }, { headers });
            alert('Password reset request rejected');
            setAdminComments({ ...adminComments, [requestId]: '' });
            fetchResetRequests();
        } catch (err) {
            alert(err.response?.data?.message || 'Rejection failed');
        }
    };

    const pendingCount = resetRequests.filter(r => r.status === 'Pending').length;

    return (
        <div>
            <h1>Admin Dashboard</h1>

            <div>
                <button onClick={() => setActiveTab('organizers')} style={{ fontWeight: activeTab === 'organizers' ? 'bold' : 'normal', marginRight: '10px' }}>
                    Manage Clubs/Organizers
                </button>
                <button onClick={() => setActiveTab('resets')} style={{ fontWeight: activeTab === 'resets' ? 'bold' : 'normal' }}>
                    Password Reset Requests {pendingCount > 0 && `(${pendingCount} pending)`}
                </button>
            </div>
            <hr />

            {activeTab === 'organizers' && (
                <div>
                    <h3>Create New Organization</h3>
                    <form onSubmit={handleCreateOrg}>
                        <input type="text" placeholder="Organization Name" onChange={(e) => setOrgData({ ...orgData, organizerName: e.target.value })} required />
                        <input type="email" placeholder="Organization Email" onChange={(e) => setOrgData({ ...orgData, email: e.target.value })} required />
                        <input type="password" placeholder="Temporary Password" onChange={(e) => setOrgData({ ...orgData, password: e.target.value })} required />
                        <select onChange={(e) => setOrgData({ ...orgData, category: e.target.value })} required>
                            <option value="">Select Category</option>
                            <option value="Technology">Technology</option>
                            <option value="Music">Music</option>
                            <option value="Dance">Dance</option>
                            <option value="Drama">Drama</option>
                            <option value="Art">Art</option>
                            <option value="Sports">Sports</option>
                            <option value="Gaming">Gaming</option>
                            <option value="Photography">Photography</option>
                            <option value="Literature">Literature</option>
                            <option value="Quiz">Quiz</option>
                            <option value="Robotics">Robotics</option>
                            <option value="Coding">Coding</option>
                            <option value="Design">Design</option>
                        </select>
                        <textarea placeholder="Description" onChange={(e) => setOrgData({ ...orgData, description: e.target.value })} required />
                        <button type="submit">Create Organizer Account</button>
                    </form>

                    <hr />
                    <h3>Manage Organizers ({organizers.length})</h3>
                    {organizers.length === 0 ? <p>No organizers.</p> : (
                        <table>
                            <thead>
                                <tr><th>Name</th><th>Email</th><th>Category</th><th>Status</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {organizers.map(org => (
                                    <tr key={org._id}>
                                        <td>{org.organizerName}</td>
                                        <td>{org.email}</td>
                                        <td>{org.category}</td>
                                        <td>{org.disabled ? 'Disabled' : 'Active'}</td>
                                        <td>
                                            {!org.disabled && <button onClick={() => handleDisable(org._id)}>Disable</button>}
                                            <button onClick={() => handleDelete(org._id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {activeTab === 'resets' && (
                <div>
                    <h3>Password Reset Requests</h3>
                    {resetRequests.length === 0 ? <p>No reset requests.</p> : (
                        <table>
                            <thead>
                                <tr><th>Club Name</th><th>Email</th><th>Date</th><th>Reason</th><th>Status</th><th>Comments</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {resetRequests.map(req => (
                                    <tr key={req._id}>
                                        <td>{req.organizer?.organizerName || 'N/A'}</td>
                                        <td>{req.organizer?.email || 'N/A'}</td>
                                        <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                                        <td>{req.reason}</td>
                                        <td>{req.status}</td>
                                        <td>
                                            {req.status === 'Pending' ? (
                                                <input type="text" placeholder="Comments..."
                                                    value={adminComments[req._id] || ''}
                                                    onChange={e => setAdminComments({ ...adminComments, [req._id]: e.target.value })} />
                                            ) : (
                                                req.adminComments || '-'
                                            )}
                                        </td>
                                        <td>
                                            {req.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => handleApproveReset(req._id)} style={{ color: 'green' }}>Approve</button>
                                                    <button onClick={() => handleRejectReset(req._id)} style={{ color: 'red', marginLeft: '5px' }}>Reject</button>
                                                </>
                                            )}
                                            {req.status === 'Approved' && <span>Approved | New pwd: {req.generatedPassword || 'shared'}</span>}
                                            {req.status === 'Rejected' && <span>Rejected</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminBoard;