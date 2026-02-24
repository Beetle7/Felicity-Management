import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });

            console.log("Login response:", res.data);

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('userRole', res.data.role);

            const userId = res.data.id;
            localStorage.setItem('userId', userId);

            if (res.data.role === 'Admin') {
                navigate('/admin');
            } else if (res.data.role === 'Organizer') {
                navigate('/org-dashboard');
            } else {
                const profileRes = await axios.get(`${API_URL}/api/profile`, {
                    headers: { Authorization: `Bearer ${res.data.token}` }
                });
                if (!profileRes.data.interests || profileRes.data.interests.length === 0) {
                    navigate('/onboarding');
                } else {
                    navigate('/events');
                }
            }
        } catch (err) {
            alert(err.response?.data?.message || "Login failed");
        }
    };

    return (
        <div>
            <h1>Login</h1>
            <form onSubmit={handleLogin}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;