import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import API_URL from '../config';

const Discussion = ({ eventId, isOrganizer }) => {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    // Parse current user from token
    const currentUser = (() => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.user;
        } catch { return null; }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchMessages();

        const newSocket = io(`${API_URL}`, {
            auth: { token }
        });

        newSocket.on('connect', () => {
            newSocket.emit('join_event', eventId);
        });

        newSocket.on('new_message', (message) => {
            setMessages(prev => [...prev, message]);
        });

        setSocket(newSocket);

        return () => {
            newSocket.emit('leave_event', eventId);
            newSocket.disconnect();
        };
    }, [eventId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/messages/${eventId}`, { headers });
            setMessages(res.data);
        } catch (err) { console.error(err); }
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        if (socket && socket.connected) {
            socket.emit('send_message', {
                eventId,
                text: text.trim(),
                parentId: replyTo?._id || null
            });
        } else {
            // REST fallback
            axios.post(`${API_URL}/api/messages/${eventId}`, {
                text: text.trim(),
                parentId: replyTo?._id || null
            }, { headers }).then(res => {
                setMessages(prev => [...prev, res.data]);
            }).catch(err => console.error(err));
        }

        setText('');
        setReplyTo(null);
    };

    const handlePin = async (messageId) => {
        try {
            await axios.put(`${API_URL}/api/messages/${messageId}/pin`, {}, { headers });
            fetchMessages();
        } catch (err) { alert(err.response?.data?.message || 'Pin failed'); }
    };

    const handleDelete = async (messageId) => {
        if (!window.confirm('Delete this message?')) return;
        try {
            await axios.delete(`${API_URL}/api/messages/${messageId}`, { headers });
            fetchMessages();
        } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
    };

    const handleReaction = async (messageId, reaction) => {
        try {
            const res = await axios.put(`${API_URL}/api/messages/${messageId}/react`, { reaction }, { headers });
            setMessages(prev => prev.map(m => m._id === messageId ? res.data : m));
        } catch (err) { console.error(err); }
    };

    const REACTIONS = ['like', 'agree', 'disagree', 'helpful'];

    const getSenderName = (msg) => {
        if (!msg.sender) return 'Unknown';
        if (msg.sender.role === 'Organizer') return msg.sender.organizerName || 'Organizer';
        return `${msg.sender.firstName || ''} ${msg.sender.lastName || ''}`.trim();
    };

    const pinnedMessages = messages.filter(m => m.pinned);
    const topLevelMessages = messages.filter(m => !m.parentId);
    const getReplies = (parentId) => messages.filter(m => m.parentId === parentId);

    const renderMessage = (msg, isReply = false) => {
        const reactionCounts = {};
        (msg.reactions || []).forEach(r => {
            reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
        });

        const userReacted = (reaction) => {
            return (msg.reactions || []).some(r => r.emoji === reaction && r.user === currentUser?.id);
        };

        return (
            <div key={msg._id} style={{
                marginLeft: isReply ? '30px' : '0',
                padding: '8px',
                borderLeft: isReply ? '2px solid #ccc' : 'none',
                borderBottom: '1px solid #eee',
                marginBottom: '4px'
            }}>
                <div>
                    <strong>{getSenderName(msg)}</strong>
                    {msg.sender?.role === 'Organizer' && <span> [Organizer]</span>}
                    <span style={{ marginLeft: '10px', color: '#888', fontSize: '0.85em' }}>
                        {new Date(msg.createdAt).toLocaleString()}
                    </span>
                    {msg.pinned && <span style={{ marginLeft: '5px' }}>[PINNED]</span>}
                </div>

                <div style={{ margin: '4px 0' }}>{msg.text}</div>

                <div style={{ fontSize: '0.85em' }}>
                    {REACTIONS.map(r => (
                        <button key={r} onClick={() => handleReaction(msg._id, r)}
                            style={{
                                marginRight: '5px',
                                fontWeight: userReacted(r) ? 'bold' : 'normal',
                                background: 'none',
                                border: '1px solid #ddd',
                                cursor: 'pointer',
                                padding: '2px 6px'
                            }}>
                            {r}{reactionCounts[r] ? ` (${reactionCounts[r]})` : ''}
                        </button>
                    ))}

                    {!isReply && (
                        <button onClick={() => setReplyTo(msg)}
                            style={{ marginLeft: '5px', background: 'none', border: '1px solid #ddd', cursor: 'pointer', padding: '2px 6px' }}>
                            reply
                        </button>
                    )}

                    {(isOrganizer || msg.sender?._id === currentUser?.id) && !msg.deleted && (
                        <button onClick={() => handleDelete(msg._id)}
                            style={{ marginLeft: '5px', color: 'red', background: 'none', border: '1px solid #ddd', cursor: 'pointer', padding: '2px 6px' }}>
                            delete
                        </button>
                    )}

                    {isOrganizer && (
                        <button onClick={() => handlePin(msg._id)}
                            style={{ marginLeft: '5px', background: 'none', border: '1px solid #ddd', cursor: 'pointer', padding: '2px 6px' }}>
                            {msg.pinned ? 'unpin' : 'pin'}
                        </button>
                    )}
                </div>

                {!isReply && getReplies(msg._id).map(reply => renderMessage(reply, true))}
            </div>
        );
    };

    return (
        <div>
            <h3>Discussion</h3>

            {pinnedMessages.length > 0 && (
                <div style={{ border: '1px solid #999', padding: '10px', marginBottom: '10px' }}>
                    <strong>Pinned Messages</strong>
                    {pinnedMessages.map(m => renderMessage(m))}
                </div>
            )}

            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                {topLevelMessages.length === 0 ? (
                    <p>No messages yet. Start the discussion!</p>
                ) : (
                    topLevelMessages.map(m => renderMessage(m))
                )}
                <div ref={messagesEndRef} />
            </div>

            {replyTo && (
                <div style={{ padding: '5px', background: '#f0f0f0', marginBottom: '5px' }}>
                    Replying to {getSenderName(replyTo)}: "{replyTo.text.substring(0, 50)}..."
                    <button onClick={() => setReplyTo(null)} style={{ marginLeft: '10px' }}>Cancel</button>
                </div>
            )}

            <form onSubmit={handleSend} style={{ display: 'flex' }}>
                <input
                    type="text"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Type a message..."
                    style={{ flex: 1, padding: '8px' }}
                />
                <button type="submit" style={{ padding: '8px 16px', marginLeft: '5px' }}>Send</button>
            </form>
        </div>
    );
};

export default Discussion;
