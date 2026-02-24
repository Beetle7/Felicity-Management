import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import API_URL from '../config';

const ClubDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [tab, setTab] = useState('upcoming');

    useEffect(() => {
        const fetchClub = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/clubs/${id}`);
                setData(res.data);
            } catch (err) { console.error(err); }
        };
        fetchClub();
    }, [id]);

    if (!data) return <p>Loading...</p>;

    const events = tab === 'upcoming' ? data.upcoming : data.past;

    return (
        <div>
            <h1>{data.club.organizerName}</h1>
            <p>Category: {data.club.category}</p>
            <p>Description: {data.club.description}</p>
            <p>Contact: {data.club.contactEmail || 'N/A'}</p>

            <hr />

            <button onClick={() => setTab('upcoming')}>Upcoming ({data.upcoming.length})</button>
            <button onClick={() => setTab('past')}>Past ({data.past.length})</button>

            {events.length === 0 ? <p>No {tab} events.</p> : (
                <table>
                    <thead><tr><th>Name</th><th>Type</th><th>Date</th><th>Fee</th></tr></thead>
                    <tbody>
                        {events.map(event => (
                            <tr key={event._id}>
                                <td><a href="#" onClick={(e) => { e.preventDefault(); navigate(`/events/${event._id}`); }}>{event.eventname}</a></td>
                                <td>{event.type}</td>
                                <td>{new Date(event.eventstart).toLocaleDateString()}</td>
                                <td>{event.regfee || 'Free'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ClubDetail;
