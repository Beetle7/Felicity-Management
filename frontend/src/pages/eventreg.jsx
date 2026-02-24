import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Discussion from '../components/discussion';
import API_URL from '../config';

const EventReg = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);

    const [responses, setResponses] = useState([]);

    const [merchDetails, setMerchDetails] = useState({
        size: '',
        color: '',
        variant: '',
        quantity: 1,
        paymentProof: ''
    });

    useEffect(() => {
        fetchEventDetails();
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/events/${eventId}`);
            setEvent(res.data);

            const initialResponses = res.data.form.map(f => ({ label: f.label, value: '' }));
            setResponses(initialResponses);
        } catch (err) {
            console.error("Failed to fetch event", err);
        }
    };

    const handleResponseChange = (index, val) => {
        const updated = [...responses];
        updated[index].value = val;
        setResponses(updated);
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        //deadline check
        if (new Date() > new Date(event.regdeadline)) {
            alert("Registration deadline has passed.");
            return;
        }

        const payload = {
            eventId: event._id,
            responses: responses,
            ...merchDetails
        };

        try {
            const res = await axios.post(`${API_URL}/api/registrations/register`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const isMerch = event.type === 'Merchandise';
            if (isMerch) {
                alert('Order placed! Awaiting payment approval from organizer.');
            } else {
                alert('Registered successfully! Ticket details have been sent to your registered email.');
            }
            navigate('/history');
        } catch (err) {
            alert(err.response?.data?.message || "Registration failed");
        }
    };

    if (!event) return <p>Loading event details...</p>;

    return (
        <div>
            <h1>{event.eventname}</h1>
            <p>{event.description}</p>
            <p><strong>Type:</strong> {event.type}</p>
            <p><strong>Eligibility:</strong> {event.eligibility || 'All'}</p>
            <p><strong>Event Dates:</strong> {new Date(event.eventstart).toLocaleString()} - {new Date(event.eventend).toLocaleString()}</p>
            <p><strong>Reg Deadline:</strong> {new Date(event.regdeadline).toLocaleString()}</p>
            <p><strong>Fee:</strong> {event.regfee ? 'Rs.' + event.regfee : 'Free'}</p>
            <p><strong>Reg Limit:</strong> {event.reglimit || 'Unlimited'} | <strong>Registered:</strong> {event.registrationCount || 0}</p>
            <p><strong>Organizer:</strong> {event.orgID?.organizerName || 'N/A'} ({event.orgID?.category || ''})</p>
            {(event.tags || []).length > 0 && <p><strong>Tags:</strong> {event.tags.join(', ')}</p>}

            <hr />

            <form onSubmit={handleRegister}>
                <h3>Registration Form</h3>

                {event.form.map((field, index) => (
                    <div key={index}>
                        <label>{field.label} {field.required && '*'}</label>
                        <br />

                        {field.fieldType === 'text' && (
                            <input
                                type="text"
                                required={field.required}
                                onChange={(e) => handleResponseChange(index, e.target.value)}
                            />
                        )}

                        {field.fieldType === 'dropdown' && (
                            <select required={field.required} onChange={(e) => handleResponseChange(index, e.target.value)}>
                                <option value="">Select an option</option>
                                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        )}

                        {field.fieldType === 'checkbox' && (
                            <div>
                                {field.options.map(opt => (
                                    <label key={opt}>
                                        <input
                                            type="checkbox"
                                            value={opt}
                                            onChange={(e) => {
                                                const currentVal = responses[index].value || [];
                                                const newVal = e.target.checked
                                                    ? [...currentVal, opt]
                                                    : currentVal.filter(v => v !== opt);
                                                handleResponseChange(index, newVal);
                                            }}
                                        /> {opt}
                                    </label>
                                ))}
                            </div>
                        )}

                        {field.fieldType === 'file upload' && (
                            <input
                                type="file"
                                required={field.required}
                                onChange={(e) => handleResponseChange(index, e.target.files[0].name)}
                            />
                        )}
                        <br /><br />
                    </div>
                ))}

                {event.type === 'Merchandise' && (
                    <div style={{ border: '1px solid blue', padding: '10px' }}>
                        <h4>Item Selection</h4>
                        {event.iteminfo?.size?.length > 0 && (
                            <div>
                                <label>Size: </label>
                                <select onChange={(e) => setMerchDetails({ ...merchDetails, size: e.target.value })}>
                                    <option value="">Select Size</option>
                                    {event.iteminfo.size.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        )}
                        {event.iteminfo?.color?.length > 0 && (
                            <div>
                                <label>Color: </label>
                                <select onChange={(e) => setMerchDetails({ ...merchDetails, color: e.target.value })}>
                                    <option value="">Select Color</option>
                                    {event.iteminfo.color.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label>Quantity: </label>
                            <input
                                type="number"
                                min="1"
                                max={event.purchaselimit}
                                value={merchDetails.quantity}
                                onChange={(e) => setMerchDetails({ ...merchDetails, quantity: e.target.value })}
                            />
                        </div>
                        <div>
                            <label>Payment Proof (paste image URL): </label>
                            <input
                                type="text"
                                placeholder="https://drive.google.com/... or image URL"
                                value={merchDetails.paymentProof}
                                onChange={(e) => setMerchDetails({ ...merchDetails, paymentProof: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                )}

                <button type="submit" style={{ marginTop: '20px' }}>Confirm Registration</button>
            </form>
            <hr />
            <Discussion eventId={eventId} isOrganizer={false} />
        </div>
    );
};

export default EventReg;