import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

const ClubList = () => {
    const [clubs, setClubs] = useState([]);
    const [followedIds, setFollowedIds] = useState([]);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    useEffect(() => {
        fetchClubs();
        if (token && role === 'Participant') fetchFollowed();
    }, []);

    const fetchClubs = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/clubs`);
            setClubs(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchFollowed = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFollowedIds((res.data.followedClubs || []).map(c => c._id || c));
        } catch (err) { console.error(err); }
    };

    const handleFollow = async (clubId) => {
        try {
            await axios.post(`${API_URL}/api/clubs/${clubId}/follow`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFollowedIds([...followedIds, clubId]);
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const handleUnfollow = async (clubId) => {
        try {
            await axios.delete(`${API_URL}/api/clubs/${clubId}/follow`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFollowedIds(followedIds.filter(id => id !== clubId));
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    return (
        <div>
            <h1>Clubs / Organizers</h1>
            {clubs.length === 0 ? <p>No clubs found.</p> : (
                <table>
                    <thead>
                        <tr><th>Name</th><th>Category</th><th>Description</th>{role === 'Participant' && token && <th>Follow</th>}</tr>
                    </thead>
                    <tbody>
                        {clubs.map(club => (
                            <tr key={club._id}>
                                <td><button onClick={() => navigate(`/clubs/${club._id}`)} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>{club.organizerName}</button></td>
                                <td>{club.category}</td>
                                <td>{club.description}</td>
                                {role === 'Participant' && token && (
                                    <td>
                                        {followedIds.includes(club._id)
                                            ? <button onClick={() => handleUnfollow(club._id)}>Unfollow</button>
                                            : <button onClick={() => handleFollow(club._id)}>Follow</button>
                                        }
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ClubList;
