import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        navigate('/login');
    };

    return (
        <nav style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
            {!token ? (
                <>
                    <Link to="/login" style={{ marginRight: '10px' }}>Login</Link>
                    <Link to="/register" style={{ marginRight: '10px' }}>Register</Link>
                </>
            ) : (
                <>
                    <Link to="/events" style={{ marginRight: '10px' }}>Browse Events</Link>
                    <Link to="/clubs" style={{ marginRight: '10px' }}>Clubs</Link>
                    {/* Participant: Dashboard, Browse Events, Clubs, Profile, Logout */}
                    {role === 'Participant' && (
                        <>
                            <Link to="/history" style={{ marginRight: '10px' }}>My Events</Link>
                        </>
                    )}

                    {/* Organizer: Dashboard, Create Event, Profile, Logout */}
                    {role === 'Organizer' && (
                        <>
                            <Link to="/org-dashboard" style={{ marginRight: '10px' }}>Dashboard</Link>
                        </>
                    )}

                    {/* Admin: Dashboard, Manage Clubs/Organizers, Logout */}
                    {role === 'Admin' && (
                        <>
                            <Link to="/admin" style={{ marginRight: '10px' }}>Admin Dashboard</Link>
                        </>
                    )}

                    <Link to="/profile" style={{ marginRight: '10px' }}>Profile</Link>
                    <button onClick={handleLogout}>Logout</button>
                </>
            )}
        </nav>
    );
};

export default Navbar;