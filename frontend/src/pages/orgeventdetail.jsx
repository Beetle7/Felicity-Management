import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Discussion from '../components/discussion';
import API_URL from '../config';

const OrgEventDetail = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [merchOrders, setMerchOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('participants');
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [feedbackData, setFeedbackData] = useState(null);
    const [feedbackFilter, setFeedbackFilter] = useState(0);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchEvent();
        fetchParticipants();
    }, [eventId]);

    useEffect(() => {
        if (event?.type === 'Merchandise') {
            fetchMerchOrders();
        }
        if (event) {
            fetchFeedback();
        }
    }, [event]);

    const fetchEvent = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/events/${eventId}`);
            setEvent(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchFeedback = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/feedback/event/${eventId}`, { headers });
            setFeedbackData(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchParticipants = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/registrations/participants/${eventId}`, { headers });
            setParticipants(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchMerchOrders = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/registrations/merch-orders/${eventId}`, { headers });
            setMerchOrders(res.data);
        } catch (err) { console.error(err); }
    };

    const startEdit = () => {
        setEditData({
            eventname: event.eventname,
            description: event.description,
            eligibility: event.eligibility || '',
            regdeadline: event.regdeadline?.slice(0, 10) || '',
            eventstart: event.eventstart?.slice(0, 16) || '',
            eventend: event.eventend?.slice(0, 16) || '',
            reglimit: event.reglimit || '',
            regfee: event.regfee || '',
            tags: (event.tags || []).join(', '),
            status: event.status
        });
        setEditing(true);
    };

    const handleSaveEdit = async () => {
        try {
            const payload = { ...editData };
            if (payload.tags && typeof payload.tags === 'string') {
                payload.tags = payload.tags.split(',').map(t => t.trim()).filter(Boolean);
            }
            await axios.put(`${API_URL}/api/events/${eventId}`, payload, { headers });
            alert('Event updated');
            setEditing(false);
            fetchEvent();
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed');
        }
    };

    const handleApprove = async (orderId) => {
        if (!window.confirm('Approve this payment? Stock will be decremented and ticket will be generated.')) return;
        try {
            await axios.put(`${API_URL}/api/registrations/${orderId}/approve`, {}, { headers });
            alert('Payment approved!');
            fetchMerchOrders();
            fetchEvent();
        } catch (err) {
            alert(err.response?.data?.message || 'Approval failed');
        }
    };

    const handleReject = async (orderId) => {
        if (!window.confirm('Reject this payment?')) return;
        try {
            await axios.put(`${API_URL}/api/registrations/${orderId}/reject`, {}, { headers });
            alert('Payment rejected');
            fetchMerchOrders();
        } catch (err) {
            alert(err.response?.data?.message || 'Rejection failed');
        }
    };

    const exportCSV = () => {
        const headers = ['Name', 'Email', 'College', 'Ticket', 'Status'];
        const rows = participants.map(r => [
            `${r.participant?.firstName || ''} ${r.participant?.lastName || ''}`,
            r.participant?.email || '',
            r.participant?.collegeName || '',
            r.ticketnum || '',
            r.status
        ]);
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${event?.eventname || 'participants'}.csv`;
        a.click();
    };

    if (!event) return <p>Loading...</p>;

    const filtered = participants.filter(r => {
        if (!searchTerm) return true;
        const name = `${r.participant?.firstName || ''} ${r.participant?.lastName || ''}`.toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || (r.participant?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    });

    const confirmed = participants.filter(r => r.status === 'Confirmed').length;
    const cancelled = participants.filter(r => r.status === 'Cancelled').length;
    const pending = participants.filter(r => r.status === 'Pending').length;

    return (
        <div>
            <h1>{event.eventname}</h1>
            <p>Type: {event.type} | Status: {event.status}</p>
            <p>Dates: {new Date(event.eventstart).toLocaleDateString()} - {new Date(event.eventend).toLocaleDateString()}</p>
            <p>Deadline: {new Date(event.regdeadline).toLocaleDateString()}</p>
            <p>Fee: {event.regfee || 'Free'} | Limit: {event.reglimit || 'None'}</p>
            <p>Confirmed: {confirmed} | Pending: {pending} | Cancelled: {cancelled} | Revenue: {confirmed * (event.regfee || 0)}</p>
            {event.type === 'Merchandise' && <p>Stock Remaining: {event.quantity}</p>}

            <div style={{ marginTop: '10px' }}>
                <a href={`${API_URL}/api/registrations/export/${eventId}`}
                    target="_blank" rel="noreferrer"
                    style={{ marginRight: '10px' }}>
                    <button>Export Participants CSV</button>
                </a>
                <button onClick={() => navigate(`/scanner/${eventId}`)}>QR Scanner and Attendance</button>
            </div>

            {/* Edit Section */}
            {!editing && (event.registrationCount === 0) && (
                <button onClick={startEdit}>Edit Event</button>
            )}
            {(event.registrationCount > 0) && !editing && (
                <p><em>Editing locked — this event has registrations.</em></p>
            )}

            {editing && (
                <div style={{ border: '1px solid #999', padding: '15px', marginTop: '10px' }}>
                    <h3>Edit Event</h3>

                    {event.status === 'Draft' && (
                        <>
                            <div><label>Name: </label><input value={editData.eventname} onChange={e => setEditData({ ...editData, eventname: e.target.value })} /></div>
                            <div><label>Eligibility: </label><input value={editData.eligibility} onChange={e => setEditData({ ...editData, eligibility: e.target.value })} /></div>
                            <div><label>Start: </label><input type="datetime-local" value={editData.eventstart} onChange={e => setEditData({ ...editData, eventstart: e.target.value })} /></div>
                            <div><label>End: </label><input type="datetime-local" value={editData.eventend} onChange={e => setEditData({ ...editData, eventend: e.target.value })} /></div>
                            <div><label>Fee: </label><input type="number" value={editData.regfee} onChange={e => setEditData({ ...editData, regfee: e.target.value })} /></div>
                            <div><label>Tags: </label><input value={editData.tags} onChange={e => setEditData({ ...editData, tags: e.target.value })} /></div>
                        </>
                    )}

                    {(event.status === 'Draft' || event.status === 'Published') && (
                        <>
                            <div><label>Description: </label><textarea value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} /></div>
                            <div><label>Deadline: </label><input type="date" value={editData.regdeadline} onChange={e => setEditData({ ...editData, regdeadline: e.target.value })} /></div>
                            <div><label>Reg Limit: </label><input type="number" value={editData.reglimit} onChange={e => setEditData({ ...editData, reglimit: e.target.value })} /></div>
                        </>
                    )}

                    {(event.status === 'Published' || event.status === 'Ongoing') && (
                        <div>
                            <label>Status: </label>
                            <select value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })}>
                                <option value={event.status}>{event.status}</option>
                                {event.status === 'Published' && <option value="Closed">Close Registrations</option>}
                                {event.status === 'Ongoing' && <option value="Closed">Close Event</option>}
                            </select>
                        </div>
                    )}

                    <br />
                    <button onClick={handleSaveEdit}>Save Changes</button>
                    <button onClick={() => setEditing(false)} style={{ marginLeft: '10px' }}>Cancel</button>
                </div>
            )}

            <hr />

            <div>
                <button onClick={() => setActiveTab('participants')} style={{ fontWeight: activeTab === 'participants' ? 'bold' : 'normal' }}>
                    Participants ({filtered.length})
                </button>
                {event.type === 'Merchandise' && (
                    <button onClick={() => setActiveTab('orders')} style={{ marginLeft: '10px', fontWeight: activeTab === 'orders' ? 'bold' : 'normal' }}>
                        Merch Orders ({merchOrders.length})
                    </button>
                )}
                <button onClick={() => setActiveTab('feedback')} style={{ marginLeft: '10px', fontWeight: activeTab === 'feedback' ? 'bold' : 'normal' }}>
                    Feedback {feedbackData ? `(${feedbackData.totalRatings})` : ''}
                </button>
            </div>
            <br />

            {activeTab === 'participants' && (
                <div>
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <button onClick={exportCSV}>Export CSV</button>

                    {filtered.length === 0 ? <p>No participants.</p> : (
                        <table>
                            <thead><tr><th>Name</th><th>Email</th><th>College</th><th>Ticket</th><th>Status</th></tr></thead>
                            <tbody>
                                {filtered.map(reg => (
                                    <tr key={reg._id}>
                                        <td>{reg.participant?.firstName} {reg.participant?.lastName}</td>
                                        <td>{reg.participant?.email}</td>
                                        <td>{reg.participant?.collegeName || 'IIIT'}</td>
                                        <td><code>{reg.ticketnum || '-'}</code></td>
                                        <td>{reg.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {activeTab === 'orders' && (
                <div>
                    <h3>Merchandise Orders</h3>
                    {merchOrders.length === 0 ? <p>No orders yet.</p> : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Size</th>
                                    <th>Color</th>
                                    <th>Qty</th>
                                    <th>Payment Proof</th>
                                    <th>Payment Status</th>
                                    <th>Order Status</th>
                                    <th>Ticket</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {merchOrders.map(order => (
                                    <tr key={order._id}>
                                        <td>{order.participant?.firstName} {order.participant?.lastName}</td>
                                        <td>{order.participant?.email}</td>
                                        <td>{order.size || '-'}</td>
                                        <td>{order.color || '-'}</td>
                                        <td>{order.quantity}</td>
                                        <td>
                                            {order.paymentProof ? (
                                                <a href={order.paymentProof} target="_blank" rel="noreferrer">View Proof</a>
                                            ) : 'Not uploaded'}
                                        </td>
                                        <td>{order.paymentStatus || '-'}</td>
                                        <td>{order.status}</td>
                                        <td><code>{order.ticketnum || '-'}</code></td>
                                        <td>
                                            {order.paymentStatus === 'Pending' && (
                                                <>
                                                    <button onClick={() => handleApprove(order._id)} style={{ color: 'green' }}>Approve</button>
                                                    <button onClick={() => handleReject(order._id)} style={{ color: 'red', marginLeft: '5px' }}>Reject</button>
                                                </>
                                            )}
                                            {order.paymentStatus === 'Approved' && <span>Approved</span>}
                                            {order.paymentStatus === 'Rejected' && <span>Rejected</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {activeTab === 'feedback' && (
                <div>
                    {!feedbackData || feedbackData.totalRatings === 0 ? (
                        <p>No feedback yet.</p>
                    ) : (
                        <div>
                            <h3>Average Rating: {feedbackData.avgRating}/5 ({feedbackData.totalRatings} reviews)</h3>
                            <div style={{ marginBottom: '10px' }}>
                                {feedbackData.ratingBreakdown.map(b => (
                                    <span key={b.stars} style={{ marginRight: '15px' }}>
                                        <button onClick={() => setFeedbackFilter(feedbackFilter === b.stars ? 0 : b.stars)}
                                            style={{ fontWeight: feedbackFilter === b.stars ? 'bold' : 'normal' }}>
                                            {b.stars}/5 ({b.count})
                                        </button>
                                    </span>
                                ))}
                                {feedbackFilter > 0 && <button onClick={() => setFeedbackFilter(0)}>Show All</button>}
                            </div>
                            <table>
                                <thead><tr><th>Rating</th><th>Comment</th><th>Date</th></tr></thead>
                                <tbody>
                                    {feedbackData.feedbacks
                                        .filter(f => feedbackFilter === 0 || f.rating === feedbackFilter)
                                        .map(f => (
                                            <tr key={f._id}>
                                                <td>{f.rating}/5</td>
                                                <td>{f.comment || <em>No comment</em>}</td>
                                                <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <hr />
            <Discussion eventId={eventId} isOrganizer={true} />
        </div>
    );
};

export default OrgEventDetail;
