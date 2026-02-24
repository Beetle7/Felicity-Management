import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import API_URL from '../config';

const QRScanner = () => {
    const { eventId } = useParams();
    const [ticketInput, setTicketInput] = useState('');
    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState('');
    const [dashboard, setDashboard] = useState(null);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => { fetchDashboard(); }, []);

    const fetchDashboard = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/registrations/attendance/${eventId}`, { headers });
            setDashboard(res.data);
        } catch (err) { console.error(err); }
    };

    const handleScan = async () => {
        setScanResult(null);
        setScanError('');
        if (!ticketInput.trim()) { setScanError('Enter a ticket number'); return; }
        try {
            const res = await axios.post(`${API_URL}/api/registrations/scan`, { ticketnum: ticketInput.trim() }, { headers });
            setScanResult(res.data);
            setTicketInput('');
            fetchDashboard();
        } catch (err) {
            setScanError(err.response?.data?.message || 'Scan failed');
        }
    };

    const handleManual = async (regId) => {
        try {
            await axios.put(`${API_URL}/api/registrations/${regId}/attend`, {}, { headers });
            alert('Attendance marked manually');
            fetchDashboard();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed');
        }
    };

    const handleExportCSV = () => {
        window.open(`${API_URL}/api/registrations/export/${eventId}?token=${token}`, '_blank');
    };

    const handleExportAttendance = () => {
        if (!dashboard) return;
        let csv = 'Name,Email,Ticket,Status,Attended At\n';
        for (const a of dashboard.attended) {
            csv += `"${a.name}","${a.email}","${a.ticketnum}","Attended","${new Date(a.attendedAt).toLocaleString()}"\n`;
        }
        for (const a of dashboard.notAttended) {
            csv += `"${a.name}","${a.email}","${a.ticketnum}","Not Attended",""\n`;
        }
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'attendance_report.csv'; a.click();
    };

    return (
        <div>
            <h1>QR Scanner & Attendance</h1>

            {/* Scanner Section */}
            <div style={{ border: '2px solid #333', borderRadius: '8px', padding: '20px', marginBottom: '20px', maxWidth: '500px' }}>
                <h2>Scan Ticket</h2>
                <p>Scan the QR code with your phone camera, then paste the ticket ID here:</p>
                <div>
                    <input
                        type="text"
                        placeholder="e.g. FLCY-XXXXXX"
                        value={ticketInput}
                        onChange={e => setTicketInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleScan()}
                        style={{ fontSize: '18px', padding: '8px', width: '250px' }}
                    />
                    <button onClick={handleScan} style={{ fontSize: '18px', padding: '8px 16px', marginLeft: '10px' }}>
                        Mark Attendance
                    </button>
                </div>

                {scanResult && (
                    <div style={{ marginTop: '10px', padding: '10px', background: '#d4edda', borderRadius: '4px' }}>
                        <strong>SUCCESS: {scanResult.message}</strong><br />
                        {scanResult.participant && (
                            <span>{scanResult.participant.name} ({scanResult.participant.email})</span>
                        )}
                    </div>
                )}
                {scanError && (
                    <div style={{ marginTop: '10px', padding: '10px', background: '#f8d7da', borderRadius: '4px' }}>
                        <strong>ERROR: {scanError}</strong>
                    </div>
                )}
            </div>

            {/* Dashboard Section */}
            {dashboard && (
                <div>
                    <h2>Attendance Dashboard</h2>
                    <p>
                        <strong>Scanned: {dashboard.attendedCount}</strong> / {dashboard.total} |
                        <strong> Remaining: {dashboard.notAttendedCount}</strong>
                    </p>
                    <button onClick={handleExportAttendance}>Export Attendance CSV</button>

                    <h3>Attended ({dashboard.attendedCount})</h3>
                    {dashboard.attended.length > 0 ? (
                        <table>
                            <thead><tr><th>Name</th><th>Email</th><th>Ticket</th><th>Time</th></tr></thead>
                            <tbody>
                                {dashboard.attended.map(a => (
                                    <tr key={a._id}>
                                        <td>{a.name}</td>
                                        <td>{a.email}</td>
                                        <td><code>{a.ticketnum}</code></td>
                                        <td>{new Date(a.attendedAt).toLocaleTimeString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p>No one scanned yet.</p>}

                    <h3>Not Yet Scanned ({dashboard.notAttendedCount})</h3>
                    {dashboard.notAttended.length > 0 ? (
                        <table>
                            <thead><tr><th>Name</th><th>Email</th><th>Ticket</th><th>Manual Override</th></tr></thead>
                            <tbody>
                                {dashboard.notAttended.map(a => (
                                    <tr key={a._id}>
                                        <td>{a.name}</td>
                                        <td>{a.email}</td>
                                        <td><code>{a.ticketnum}</code></td>
                                        <td><button onClick={() => handleManual(a._id)}>Mark Attended</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p>All participants scanned!</p>}
                </div>
            )}
        </div>
    );
};

export default QRScanner;
