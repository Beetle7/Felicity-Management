import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/navbar';
import Prot4route from './components/prot4route';

import Login from './pages/login';
import Register from './pages/registration';
import AdminBoard from './pages/adminboard';
import OrgDashboard from './pages/orgboard';
import EventsList from './pages/eventlist';
import EventReg from './pages/eventreg';
import ParHistory from './pages/parthis';
import EventParticipants from './pages/eventpar';
import Profile from './pages/profile';
import ClubList from './pages/clublist';
import ClubDetail from './pages/clubdetail';
import Onboarding from './pages/onboarding';
import OrgEventDetail from './pages/orgeventdetail';
import QRScanner from './pages/qrscanner';

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                {/*public routes*/}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/events" element={
                    <Prot4route allowedRoles={['Participant', 'Organizer', 'Admin']}>
                        <EventsList />
                    </Prot4route>
                } />
                <Route path="/clubs" element={
                    <Prot4route allowedRoles={['Participant', 'Organizer', 'Admin']}>
                        <ClubList />
                    </Prot4route>
                } />
                <Route path="/clubs/:id" element={
                    <Prot4route allowedRoles={['Participant', 'Organizer', 'Admin']}>
                        <ClubDetail />
                    </Prot4route>
                } />
                <Route
                    path="/events/:eventId"
                    element={
                        <Prot4route allowedRoles={['Participant']}>
                            <EventReg />
                        </Prot4route>
                    }
                />

                {/*participant routes*/}
                <Route
                    path="/history"
                    element={
                        <Prot4route allowedRoles={['Participant']}>
                            <ParHistory />
                        </Prot4route>
                    }
                />
                <Route
                    path="/onboarding"
                    element={
                        <Prot4route allowedRoles={['Participant']}>
                            <Onboarding />
                        </Prot4route>
                    }
                />

                {/*organizer routes*/}
                <Route
                    path="/org-dashboard"
                    element={
                        <Prot4route allowedRoles={['Organizer']}>
                            <OrgDashboard />
                        </Prot4route>
                    }
                />
                <Route
                    path="/org-event/:eventId"
                    element={
                        <Prot4route allowedRoles={['Organizer']}>
                            <OrgEventDetail />
                        </Prot4route>
                    }
                />
                <Route
                    path="/participants/:eventId"
                    element={
                        <Prot4route allowedRoles={['Organizer']}>
                            <EventParticipants />
                        </Prot4route>
                    }
                />
                <Route
                    path="/scanner/:eventId"
                    element={
                        <Prot4route allowedRoles={['Organizer']}>
                            <QRScanner />
                        </Prot4route>
                    }
                />

                {/*shared*/}
                <Route
                    path="/profile"
                    element={
                        <Prot4route allowedRoles={['Participant', 'Organizer']}>
                            <Profile />
                        </Prot4route>
                    }
                />

                {/*admin routes*/}
                <Route
                    path="/admin"
                    element={
                        <Prot4route allowedRoles={['Admin']}>
                            <AdminBoard />
                        </Prot4route>
                    }
                />

                {/*default route*/}
                <Route path="/" element={<Login />} />
            </Routes>
        </Router>
    );
}

export default App;