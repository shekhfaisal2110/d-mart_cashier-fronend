import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useRefresh } from '../context/RefreshContext';
import io from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [newMessageAlert, setNewMessageAlert] = useState(null);
  const { refreshKey } = useRefresh();
  const socketRef = useRef(null);
  const token = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  // ---------- Socket.IO (real‑time new messages) ----------
  useEffect(() => {
    if (!token || !isAdmin) return;
    const socket = io(API_BASE.replace('/api', ''));
    socketRef.current = socket;

    socket.emit('join-admin');

    socket.on('new-message', (data) => {
      setMessages((prev) => [data, ...prev]);
      setNewMessageAlert({
        id: data.id,
        message: `📩 New message from ${data.name}`,
        time: new Date(),
      });
      setTimeout(() => setNewMessageAlert(null), 8000);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, isAdmin]);

  // ---------- Fetch messages ----------
  const fetchMessages = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/contact/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data.messages || []);
    } catch (err) {
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages, refreshKey]);

  // ---------- Reply to message ----------
  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }
    setReplyLoading(true);
    try {
      await axios.put(
        `${API_BASE}/contact/admin/${selectedMessage._id}`,
        { reply: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Reply sent');
      setReplyText('');
      setSelectedMessage(null);
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };

  // ---------- Modal controls ----------
  const openReplyModal = (msg) => {
    setSelectedMessage(msg);
    setReplyText('');
  };

  const closeReplyModal = () => {
    setSelectedMessage(null);
    setReplyText('');
  };

  // ---------- Status badge ----------
  const getStatusBadge = (status) => {
    if (status === 'replied') {
      return <span className="badge badge-success">Replied</span>;
    }
    return <span className="badge badge-warning">Pending</span>;
  };

  // ---------- Render ----------
  return (
    <div className="p-4 sm:p-6">
      {/* Notification alert */}
      {newMessageAlert && (
        <div className="fixed top-4 right-4 z-50 bg-primary-50 border-l-4 border-primary p-4 rounded-lg shadow-lg max-w-sm animate-slide-down">
          <p className="text-sm font-medium text-gray-800">{newMessageAlert.message}</p>
          <p className="text-xs text-gray-500">{format(newMessageAlert.time, 'HH:mm')}</p>
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📬 Messages from Users</h2>
          <p className="text-sm text-gray-500">View and reply to all messages sent via the contact form.</p>
        </div>
        <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {messages.filter((m) => m.status === 'pending').length} pending
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="spinner" />
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr key={msg._id} className="hover:bg-gray-50 transition">
                    <td className="whitespace-nowrap font-medium text-gray-800">{msg.name}</td>
                    <td className="whitespace-nowrap">{msg.subject}</td>
                    <td className="max-w-xs truncate">{msg.message}</td>
                    <td className="whitespace-nowrap">{getStatusBadge(msg.status)}</td>
                    <td className="whitespace-nowrap text-gray-500">
                      {format(new Date(msg.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className="whitespace-nowrap">
                      {msg.status === 'pending' && (
                        <button
                          onClick={() => openReplyModal(msg)}
                          className="dmart-btn dmart-btn-primary text-xs py-1 px-3"
                        >
                          Reply
                        </button>
                      )}
                      {msg.status === 'replied' && (
                        <button
                          onClick={() => openReplyModal(msg)}
                          className="dmart-btn bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs py-1 px-3"
                        >
                          View Reply
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {messages.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      No messages found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Reply to {selectedMessage.name}</h3>
                <button
                  onClick={closeReplyModal}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Subject: {selectedMessage.subject}</p>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{selectedMessage.message}</p>
                {selectedMessage.adminReply && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-indigo-600">Your previous reply:</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedMessage.adminReply}</p>
                  </div>
                )}
              </div>
              <form onSubmit={handleReply}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Reply</label>
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    className="dmart-input"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={replyLoading}
                    className="dmart-btn dmart-btn-primary flex-1 disabled:opacity-50"
                  >
                    {replyLoading ? 'Sending...' : 'Send Reply'}
                  </button>
                  <button
                    type="button"
                    onClick={closeReplyModal}
                    className="dmart-btn bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;