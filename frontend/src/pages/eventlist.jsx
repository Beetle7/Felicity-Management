import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

const EventsList = () => {
    const [events, setEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [eligibilityFilter, setEligibilityFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFollowed, setShowFollowed] = useState(false);
    const [showTrending, setShowTrending] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchEvents();
    }, [typeFilter, eligibilityFilter, dateFrom, dateTo, showFollowed, showTrending]);

    const fetchEvents = async () => {
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (typeFilter !== 'All') params.append('type', typeFilter);
            if (eligibilityFilter) params.append('eligibility', eligibilityFilter);
            if (dateFrom) params.append('dateFrom', dateFrom);
            if (dateTo) params.append('dateTo', dateTo);
            if (showTrending) params.append('trending', 'true');
            if (showFollowed) {
                const profileRes = await axios.get(`${API_URL}/api/profile`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                const clubIds = (profileRes.data.followedClubs || []).map(c => c._id || c);
                if (clubIds.length > 0) params.append('followedClubs', clubIds.join(','));
            }

            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            const res = await axios.get(`${API_URL}/api/events/published?${params.toString()}`, config);
            setEvents(res.data);
        } catch (err) {
            console.error("Error fetching events", err);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchEvents();
    };

    return (
        <div>
            <h1>Browse Events</h1>

            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search events (fuzzy matching)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit">Search</button>
            </form>
            <br />

            <div>
                <label>Type: </label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="All">All</option>
                    <option value="Normal">Normal</option>
                    <option value="Merchandise">Merchandise</option>
                </select>

                <label style={{ marginLeft: '10px' }}>Eligibility: </label>
                <select value={eligibilityFilter} onChange={(e) => setEligibilityFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="IIIT">IIIT Only</option>
                    <option value="Non-IIIT">Non-IIIT Only</option>
                </select>

                <label style={{ marginLeft: '10px' }}>From: </label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />

                <label style={{ marginLeft: '10px' }}>To: </label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />

                {localStorage.getItem('token') && (
                    <label style={{ marginLeft: '10px' }}>
                        <input type="checkbox" checked={showFollowed} onChange={(e) => setShowFollowed(e.target.checked)} />
                        Followed Clubs Only
                    </label>
                )}

                <label style={{ marginLeft: '10px' }}>
                    <input type="checkbox" checked={showTrending} onChange={(e) => setShowTrending(e.target.checked)} />
                    Trending
                </label>
            </div>

            <hr />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {events.map(event => (
                    <div key={event._id} style={{ border: '1px solid #000', padding: '15px' }}>
                        <h2>{event.eventname}</h2>
                        <p>{event.description}</p>
                        <p><strong>Type:</strong> {event.type}</p>
                        <p><strong>Date:</strong> {new Date(event.eventstart).toLocaleDateString()} - {new Date(event.eventend).toLocaleDateString()}</p>
                        <p><strong>Eligibility:</strong> {event.eligibility || 'All'}</p>
                        <p><strong>Fee:</strong> Rs.{event.regfee || 'Free'}</p>
                        <p><strong>Organizer:</strong> {event.orgID?.organizerName || 'N/A'}</p>
                        <div>
                            {(event.tags || []).map(tag => (
                                <span key={tag} style={{ marginRight: '5px', backgroundColor: '#eee', padding: '2px 5px' }}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        <br />
                        <button onClick={() => navigate(`/events/${event._id}`)}>
                            View Details & Register
                        </button>
                    </div>
                ))}
            </div>

            {events.length === 0 && <p>No events match your filters.</p>}
        </div>
    );
};

export default EventsList;