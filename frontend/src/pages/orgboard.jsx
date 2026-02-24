import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

const OrgDashboard = () => {
    const navigate = useNavigate();
    const [myEvents, setMyEvents] = useState([]);
    const [showBuilder, setShowBuilder] = useState(false);
    const [analytics, setAnalytics] = useState(null);

    //Event Data
    const [eventData, setEventData] = useState({
        eventname: '',
        description: '',
        type: 'Normal',
        eligibility: '',
        regdeadline: '',
        eventstart: '',
        eventend: '',
        reglimit: '',
        regfee: '',
        tags: ''
    });

    //Form Builder mode
    const [formFields, setFormFields] = useState([]);

    useEffect(() => {
        fetchEvents();
        fetchAnalytics();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/events`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setMyEvents(res.data);
        } catch (err) {
            console.error("Fetch failed", err);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/registrations/analytics`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setAnalytics(res.data);
        } catch (err) {
            console.error("Analytics fetch failed", err);
        }
    };

    //Functions
    const handlePublish = async (eventId) => {
        try {
            const res = await axios.patch(`${API_URL}/api/events/${eventId}/publish`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert(res.data.message);
            fetchEvents();
        } catch (err) {
            alert(err.response?.data?.message || "Publish failed");
        }
    };

    const handleDelete = async (eventId) => {
        if (!window.confirm("Delete?")) return;
        try {
            const res = await axios.delete(`${API_URL}/api/events/${eventId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert(res.data.message);
            fetchEvents();
        } catch (err) {
            alert(err.response?.data?.message || "Delete failed");
        }
    };

    //Buold forms
    const addField = () => {
        setFormFields([...formFields, { label: '', fieldType: 'text', options: [], required: false, order: formFields.length }]);
    };

    const updateField = (index, key, value) => {
        const updated = [...formFields];
        updated[index][key] = value;
        setFormFields(updated);
    };

    const moveField = (index, direction) => {
        const updated = [...formFields];
        const target = index + direction;
        if (target < 0 || target >= updated.length) return;
        [updated[index], updated[target]] = [updated[target], updated[index]];
        setFormFields(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const finalSubmission = {
            ...eventData,
            orgID: localStorage.getItem('userId'),
            tags: eventData.tags.split(','),
            form: formFields.map((f, i) => ({ ...f, order: i }))
        };

        try {
            await axios.post(`${API_URL}/api/events`, finalSubmission, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setShowBuilder(false);
            fetchEvents();
        } catch (err) {
            alert("Create failed");
        }
    };

    return (
        <div>
            <h1>Organizer Dashboard</h1>

            <div>
                <button onClick={() => setShowBuilder(!showBuilder)}>
                    {showBuilder ? "View My Events" : "Create New Event"}
                </button>
            </div>

            {!showBuilder ? (
                <div>
                    <h2>My Events</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myEvents.map(event => (
                                <tr key={event._id}>
                                    <td>{event.eventname}</td>
                                    <td>{event.type}</td>
                                    <td>{event.status}</td>
                                    <td>
                                        <button onClick={() => navigate(`/org-event/${event._id}`)}>View</button>
                                        {event.status === 'Draft' && (
                                            <button onClick={() => handlePublish(event._id)}>Publish</button>
                                        )}
                                        <button onClick={() => handleDelete(event._id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {analytics && (
                        <div>
                            <hr />
                            <h2>Event Analytics</h2>
                            <p><strong>Total Registrations:</strong> {analytics.totalRegistrations} | <strong>Total Attendance:</strong> {analytics.totalAttendance} | <strong>Total Revenue:</strong> Rs.{analytics.totalRevenue}</p>
                            {analytics.perEvent && analytics.perEvent.length > 0 && (
                                <table>
                                    <thead>
                                        <tr><th>Event</th><th>Type</th><th>Status</th><th>Registrations</th><th>Attended</th><th>Cancelled</th><th>Revenue</th></tr>
                                    </thead>
                                    <tbody>
                                        {analytics.perEvent.map(e => (
                                            <tr key={e.eventId}>
                                                <td>{e.eventname}</td>
                                                <td>{e.type}</td>
                                                <td>{e.status}</td>
                                                <td>{e.registrations}</td>
                                                <td>{e.attended}</td>
                                                <td>{e.cancelled}</td>
                                                <td>Rs.{e.revenue}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <h2>Create Event & Form Builder</h2>

                    <div>
                        <label>Event Name:</label>
                        <input type="text" required onChange={(e) => setEventData({ ...eventData, eventname: e.target.value })} />
                    </div>
                    <div>
                        <label>Description:</label>
                        <textarea onChange={(e) => setEventData({ ...eventData, description: e.target.value })} />
                    </div>
                    <div>
                        <label>Event Type:</label>
                        <select onChange={(e) => setEventData({ ...eventData, type: e.target.value })}>
                            <option value="Normal">Normal</option>
                            <option value="Merchandise">Merchandise</option>
                        </select>
                    </div>
                    <div>
                        <label>Eligibility:</label>
                        <select onChange={(e) => setEventData({ ...eventData, eligibility: e.target.value })}>
                            <option value="">Select</option>
                            <option value="IIIT">IIIT Only</option>
                            <option value="Non-IIIT">Non-IIIT Only</option>
                            <option value="All">All</option>
                        </select>
                    </div>
                    <div>
                        <label>Event Start:</label>
                        <input type="datetime-local" onChange={(e) => setEventData({ ...eventData, eventstart: e.target.value })} />
                    </div>
                    <div>
                        <label>Event End:</label>
                        <input type="datetime-local" onChange={(e) => setEventData({ ...eventData, eventend: e.target.value })} />
                    </div>
                    <div>
                        <label>Reg Deadline:</label>
                        <input type="datetime-local" onChange={(e) => setEventData({ ...eventData, regdeadline: e.target.value })} />
                    </div>
                    <div>
                        <label>Reg Limit:</label>
                        <input type="number" onChange={(e) => setEventData({ ...eventData, reglimit: e.target.value })} />
                    </div>
                    <div>
                        <label>Reg Fee:</label>
                        <input type="number" onChange={(e) => setEventData({ ...eventData, regfee: e.target.value })} />
                    </div>
                    <div>
                        <label>Tags (comma separated):</label>
                        <input type="text" onChange={(e) => setEventData({ ...eventData, tags: e.target.value })} />
                    </div>

                    {eventData.type === 'Merchandise' && (
                        <div>
                            <hr />
                            <h3>Merchandise Details</h3>
                            <div>
                                <label>Sizes (comma separated):</label>
                                <input type="text" onChange={(e) => setEventData({ ...eventData, iteminfo: { ...eventData.iteminfo, size: e.target.value.split(',').map(s => s.trim()) } })} />
                            </div>
                            <div>
                                <label>Colors (comma separated):</label>
                                <input type="text" onChange={(e) => setEventData({ ...eventData, iteminfo: { ...eventData.iteminfo, color: e.target.value.split(',').map(s => s.trim()) } })} />
                            </div>
                            <div>
                                <label>Variants (comma separated):</label>
                                <input type="text" onChange={(e) => setEventData({ ...eventData, iteminfo: { ...eventData.iteminfo, variants: e.target.value.split(',').map(s => s.trim()) } })} />
                            </div>
                            <div>
                                <label>Stock Quantity:</label>
                                <input type="number" onChange={(e) => setEventData({ ...eventData, quantity: e.target.value })} />
                            </div>
                            <div>
                                <label>Purchase Limit per Person:</label>
                                <input type="number" onChange={(e) => setEventData({ ...eventData, purchaselimit: e.target.value })} />
                            </div>
                        </div>
                    )}

                    <hr />

                    {eventData.type === 'Normal' && (
                        <div>
                            <h3>Registration Form Builder</h3>
                            {formFields.map((field, index) => (
                                <div key={index}>
                                    <p>Question {index + 1}</p>
                                    <input
                                        type="text"
                                        placeholder="Question Label"
                                        onChange={(e) => updateField(index, 'label', e.target.value)}
                                    />
                                    <select onChange={(e) => updateField(index, 'fieldType', e.target.value)}>
                                        <option value="text">text</option>
                                        <option value="dropdown">dropdown</option>
                                        <option value="checkbox">checkbox</option>
                                        <option value="file upload">file upload</option>
                                    </select>
                                    <label>
                                        <input
                                            type="checkbox"
                                            onChange={(e) => updateField(index, 'required', e.target.checked)}
                                        /> Required
                                    </label>
                                    {(field.fieldType === 'dropdown' || field.fieldType === 'checkbox') && (
                                        <input
                                            type="text"
                                            placeholder="Options (comma separated)"
                                            onChange={(e) => updateField(index, 'options', e.target.value.split(','))}
                                        />
                                    )}
                                    <button type="button" onClick={() => setFormFields(formFields.filter((_, i) => i !== index))}>
                                        Remove
                                    </button>
                                    <button type="button" onClick={() => moveField(index, -1)} disabled={index === 0}>▲</button>
                                    <button type="button" onClick={() => moveField(index, 1)} disabled={index === formFields.length - 1}>▼</button>
                                </div>
                            ))}

                            <button type="button" onClick={addField}>Add Question</button>
                        </div>
                    )}

                    <hr />
                    <button type="submit">Save and Create Event</button>
                </form>
            )}
        </div>
    );
};

export default OrgDashboard;