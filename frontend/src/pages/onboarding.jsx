import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

const interestOptions = ['Technology', 'Music', 'Dance', 'Drama', 'Art', 'Sports', 'Gaming', 'Photography', 'Literature', 'Quiz', 'Robotics', 'Coding', 'Design'];

const Onboarding = () => {
    const [clubs, setClubs] = useState([]);
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [selectedClubs, setSelectedClubs] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClubs = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/clubs`);
                setClubs(res.data);
            } catch (err) { console.error(err); }
        };
        fetchClubs();
    }, []);

    const handleSave = async () => {
        try {
            await axios.put(`${API_URL}/api/profile/participant`,
                { interests: selectedInterests, followedClubs: selectedClubs },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            alert('Preferences saved');
            navigate('/events');
        } catch (err) { alert('Failed to save'); }
    };

    return (
        <div>
            <h1>Welcome - Set Your Preferences</h1>

            <h3>Interests</h3>
            {interestOptions.map(interest => (
                <label key={interest}>
                    <input type="checkbox" checked={selectedInterests.includes(interest)}
                        onChange={() => setSelectedInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest])} />
                    {interest}
                </label>
            ))}

            <h3>Follow Clubs</h3>
            {clubs.map(club => (
                <label key={club._id}>
                    <input type="checkbox" checked={selectedClubs.includes(club._id)}
                        onChange={() => setSelectedClubs(prev => prev.includes(club._id) ? prev.filter(id => id !== club._id) : [...prev, club._id])} />
                    {club.organizerName}
                </label>
            ))}

            <br /><br />
            <button onClick={handleSave}>Save Preferences</button>
            <button onClick={() => navigate('/events')}>Skip</button>
        </div>
    );
};

export default Onboarding;
