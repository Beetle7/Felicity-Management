import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import API_URL from '../config';

const EventParticipants = () => {
    const { eventId } = useParams();
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchParticipantList();
    }, [eventId]);

    const fetchParticipantList = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/registrations/participants/${eventId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setParticipants(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching participants", err);
            setLoading(false);
        }
    };

    if (loading) return <p>Loading participants...</p>;

    return (
        <div>
            <h1>Registered Participants</h1>
            <p>Total Registrations: {participants.length}</p>

            {participants.length === 0 ? (
                <p>No one has registered for this event yet.</p>
            ) : (
                <table border="1">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>College</th>
                            <th>Ticket</th>
                            <th>Custom Form Responses</th>
                            <th>Merch Info</th>
                        </tr>
                    </thead>
                    <tbody>
                        {participants.map((reg) => (
                            <tr key={reg._id}>
                                <td>{reg.participant?.firstName} {reg.participant?.lastName}</td>
                                <td>{reg.participant?.email}</td>
                                <td>{reg.participant?.collegeName || "IIIT"}</td>
                                <td><code>{reg.ticketnum}</code></td>
                                
                                <td>
                                    {reg.responses && reg.responses.length > 0 ? (
                                        <ul>
                                            {reg.responses.map((resp, i) => (
                                                <li key={i}>
                                                    <strong>{resp.label}:</strong> {Array.isArray(resp.value) ? resp.value.join(', ') : resp.value}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : "N/A"}
                                </td>

                                <td>
                                    {reg.size || reg.color ? (
                                        <span>{reg.size} {reg.color} ({reg.quantity} qty)</span>
                                    ) : "N/A"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default EventParticipants;