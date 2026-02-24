import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

const ParHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/registrations/history`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setHistory(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching history", err);
            setLoading(false);
        }
    };

    const handleCancel = async (registrationId) => {
        if (!window.confirm("Are you sure you want to cancel this registration?")) return;

        try {
            const res = await axios.delete(`${API_URL}/api/registrations/${registrationId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert(res.data.message);
            fetchHistory();
        } catch (err) {
            alert(err.response?.data?.message || "Cancellation failed");
        }
    };

    const tabs = ['All', 'Normal', 'Merchandise', 'Confirmed', 'Pending', 'Cancelled'];

    const filteredHistory = history.filter(reg => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Normal') return reg.event?.type === 'Normal';
        if (activeTab === 'Merchandise') return reg.event?.type === 'Merchandise';
        if (activeTab === 'Confirmed') return reg.status === 'Confirmed';
        if (activeTab === 'Pending') return reg.status === 'Pending';
        if (activeTab === 'Cancelled') return reg.status === 'Cancelled';
        return true;
    });

    const upcoming = filteredHistory.filter(r => r.event && new Date(r.event.eventstart) > new Date() && r.status === 'Confirmed');
    const past = filteredHistory.filter(r => !r.event || new Date(r.event.eventstart) <= new Date() || r.status !== 'Confirmed');

    const [feedbackForm, setFeedbackForm] = useState({ eventId: null, rating: 5, comment: '' });

    const handleFeedback = async () => {
        try {
            await axios.post(`${API_URL}/api/feedback`, feedbackForm, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert('Feedback submitted!');
            setFeedbackForm({ eventId: null, rating: 5, comment: '' });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit feedback');
        }
    };

    if (loading) return <p>Loading your event history...</p>;

    return (
        <div>
            <h1>My Events</h1>

            <div>
                {tabs.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        style={{ marginRight: '5px', fontWeight: activeTab === tab ? 'bold' : 'normal', textDecoration: activeTab === tab ? 'underline' : 'none' }}>
                        {tab}
                    </button>
                ))}
            </div>
            <br />

            {upcoming.length > 0 && (
                <div>
                    <h2>Upcoming Events</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Type</th>
                                <th>Organizer</th>
                                <th>Date</th>
                                <th>Fee</th>
                                <th>Ticket</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {upcoming.map(reg => (
                                <tr key={reg._id}>
                                    <td>{reg.event?.eventname || 'Deleted Event'}</td>
                                    <td>{reg.event?.type || 'N/A'}</td>
                                    <td>{reg.event?.orgID?.organizerName || reg.event?.orgID || 'N/A'}</td>
                                    <td>{reg.event ? new Date(reg.event.eventstart).toLocaleDateString() : 'N/A'}</td>
                                    <td>{reg.event?.regfee ? 'Rs.' + reg.event.regfee : 'Free'}</td>
                                    <td><code>{reg.ticketnum}</code></td>
                                    <td>{reg.status}</td>
                                    <td>
                                        {reg.status === 'Confirmed' && (
                                            <button onClick={() => handleCancel(reg._id)}>Cancel</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <h2>Past / All Registrations</h2>
            {past.length === 0 ? (
                <p>No registrations found.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Event</th>
                            <th>Type</th>
                            <th>Organizer</th>
                            <th>Date</th>
                            <th>Fee</th>
                            <th>Ticket</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {past.map(reg => (
                            <tr key={reg._id}>
                                <td>{reg.event?.eventname || 'Deleted Event'}</td>
                                <td>{reg.event?.type || 'N/A'}</td>
                                <td>{reg.event?.orgID?.organizerName || reg.event?.orgID || 'N/A'}</td>
                                <td>{reg.event ? new Date(reg.event.eventstart).toLocaleDateString() : 'N/A'}</td>
                                <td>{reg.event?.regfee ? 'Rs.' + reg.event.regfee : 'Free'}</td>
                                <td><code>{reg.ticketnum}</code></td>
                                <td>{reg.status}</td>
                                <td>
                                    {reg.status === 'Confirmed' && (
                                        <button onClick={() => handleCancel(reg._id)}>Cancel</button>
                                    )}
                                    {reg.event && (reg.status === 'Confirmed' || reg.status === 'Attended') && (
                                        <>
                                            {feedbackForm.eventId === reg.event._id ? (
                                                <div style={{ display: 'inline-block', marginLeft: '5px' }}>
                                                    <select value={feedbackForm.rating} onChange={e => setFeedbackForm({ ...feedbackForm, rating: Number(e.target.value) })}>
                                                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}/5</option>)}
                                                    </select>
                                                    <input type="text" placeholder="Comment..." value={feedbackForm.comment} onChange={e => setFeedbackForm({ ...feedbackForm, comment: e.target.value })} />
                                                    <button onClick={handleFeedback}>Submit</button>
                                                    <button onClick={() => setFeedbackForm({ eventId: null, rating: 5, comment: '' })}>X</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setFeedbackForm({ eventId: reg.event._id, rating: 5, comment: '' })} style={{ marginLeft: '5px' }}>
                                                    Feedback
                                                </button>
                                            )}
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ParHistory;