import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        participantType: 'IIIT',
        collegeName: '',
        contactNumber: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.participantType === 'IIIT' && !formData.email.endsWith('iiit.ac.in')) {
            alert("IIIT students must use their IIIT email (ending in iiit.ac.in)");
            return;
        }

        try {
            const res = await axios.post(`${API_URL}/api/auth/register`, formData);
            alert(res.data.message);
            navigate('/login');
        } catch (err) {
            alert(err.response?.data?.message || "Registration failed");
        }
    };

    return (
        <div>
            <h1>Register</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="First Name" onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                <input type="text" placeholder="Last Name" onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
                <input type="email" placeholder="Email" onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                <input type="password" placeholder="Password" onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />

                <label>Participant Type:</label>
                <select value={formData.participantType} onChange={(e) => setFormData({ ...formData, participantType: e.target.value })}>
                    <option value="IIIT">IIIT</option>
                    <option value="Non-IIIT">Non-IIIT</option>
                </select>

                {formData.participantType === 'Non-IIIT' && (
                    <input type="text" placeholder="College Name" onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })} required />
                )}

                <input type="text" placeholder="Contact Number" onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} required />
                <button type="submit">Register</button>
            </form>
        </div>
    );
};

export default Register;