import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import { FaGithub, FaLinkedin, FaEnvelope, FaGlobe, FaTimes } from 'react-icons/fa';
import DeveloperPhoto from '../assets/my_image.jpeg';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Developer = () => {
  const [showFullscreenPhoto, setShowFullscreenPhoto] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [myMessages, setMyMessages] = useState([]);
  const [showMessages, setShowMessages] = useState(false);

  const token = localStorage.getItem('token');
  const cashierId = localStorage.getItem('cashierId');

  // Fetch user messages
  useEffect(() => {
    if (token) {
      axios
        .get(`${API_BASE}/contact/my-messages`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setMyMessages(res.data.messages || []))
        .catch(() => {});
    }
  }, [token]);

  // Contact form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      setFormError('Please fill in all fields');
      return;
    }
    if (!token) {
      setFormError('You must be logged in');
      return;
    }
    const userName = localStorage.getItem('userName') || 'Cashier';
    const email = `${cashierId}@dmart.com`;

    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      await axios.post(
        `${API_BASE}/contact`,
        { name: userName, email, subject: form.subject, message: form.message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFormSuccess('Message sent! Admin will reply soon.');
      setForm({ subject: '', message: '' });
      const res = await axios.get(`${API_BASE}/contact/my-messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyMessages(res.data.messages || []);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to send');
    } finally {
      setFormLoading(false);
    }
  };

  // Skills
  const skills = [
    'React', 'Node.js', 'ExpressJS', 'MongoDB', 'Tailwind CSS',
    'PWA', 'REST APIs', 'JWT Auth',
  ];

  const socialLinks = [
    { icon: FaGlobe, label: 'Portfolio', url: 'https://shekhfaisal-portfolio.netlify.app/' },
    { icon: FaLinkedin, label: 'LinkedIn', url: 'https://www.linkedin.com/in/faisal-shaikh-3064582a4' },
    { icon: FaGithub, label: 'GitHub', url: 'https://github.com/shekhfaisal2110' },
    { icon: FaEnvelope, label: 'Email', url: 'mailto:shekhfaisal2110@gmail.com' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 md:space-y-8">
      {/* Developer Profile */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
            <div
              className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shadow-lg cursor-pointer flex-shrink-0 active:scale-95 transition-transform"
              onClick={() => setShowFullscreenPhoto(true)}
            >
              <img
                src={DeveloperPhoto}
                alt="Shekh Faisal - Developer"
                className="w-full h-full object-cover"
                onError={(e) => (e.target.src = '/dmart.png')}
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl md:text-3xl font-bold text-gray-800">Shekh Faisal</h2>
              <p className="text-primary font-medium text-sm md:text-base mt-1">
                Full Stack MERN Developer | Freelancer
              </p>
              <p className="text-gray-600 text-sm md:text-base mt-3 leading-relaxed">
                Passionate about building efficient, scalable web applications. I specialize in
                creating full‑stack solutions using the MERN stack (MongoDB, Express, React, Node.js).
                This D-Mart Cashier system is a testament to my commitment to clean code, seamless
                UX, and robust backend architecture.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-5">
                {socialLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full transition group"
                  >
                    <link.icon className="w-5 h-5 text-primary group-hover:scale-110 transition" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-primary">
                      {link.label}
                    </span>
                  </a>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-5">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-800">📬 Send a Message</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g., Feature suggestion, Bug report"
                className="dmart-input"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Message</label>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Your feedback, inquiry, or collaboration request..."
                className="dmart-input resize-none"
                required
              />
            </div>
            {formError && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{formError}</div>
            )}
            {formSuccess && (
              <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">{formSuccess}</div>
            )}
            <button
              type="submit"
              disabled={formLoading}
              className="dmart-btn dmart-btn-primary w-full disabled:opacity-50"
            >
              {formLoading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>

      {/* My Conversations */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">📬 My Conversations</h3>
          <button
            onClick={() => setShowMessages(!showMessages)}
            className="dmart-btn bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
          >
            {showMessages ? 'Hide' : 'Show'} ({myMessages.length})
          </button>
        </div>
        {showMessages && (
          <div className="card-body">
            {myMessages.length === 0 ? (
              <p className="text-gray-500 text-sm">No messages yet.</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {myMessages.slice(0, 20).map((msg) => (
                  <div key={msg._id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800 text-sm">{msg.subject}</h4>
                      <span className="text-xs text-gray-400">
                        {format(new Date(msg.createdAt), 'dd MMM yyyy, HH:mm')}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{msg.message}</p>
                    {msg.adminReply && (
                      <div className="mt-3 pl-3 border-l-4 border-primary">
                        <p className="text-xs font-medium text-primary">Admin reply:</p>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{msg.adminReply}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(msg.repliedAt), 'dd MMM yyyy, HH:mm')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {myMessages.length > 20 && (
              <p className="text-xs text-gray-400 mt-3">Showing last 20 messages</p>
            )}
          </div>
        )}
      </div>

      {/* Developer Credits */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-800">👤 Developer</h3>
        </div>
        <div className="card-body space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xl font-bold">
              SF
            </div>
            <div>
              <p className="font-semibold text-gray-800">Shaikh Faisal</p>
              <p className="text-gray-500">Full Stack Developer</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-gray-600">
              📧{' '}
              <a href="mailto:shekhfaisal2110@gmail.com" className="text-primary hover:underline">
                shekhfaisal2110@gmail.com
              </a>
            </p>
            <p className="text-gray-600">
              🐙{' '}
              <a
                href="https://github.com/shekhfaisal2110"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                github.com/shekhfaisal2110
              </a>
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">Made with ❤️ for D-Mart Cashier Management</p>
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Modal */}
      {showFullscreenPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowFullscreenPhoto(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <button
              onClick={() => setShowFullscreenPhoto(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              aria-label="Close fullscreen photo"
            >
              <FaTimes className="w-8 h-8" />
            </button>
            <img
              src={DeveloperPhoto}
              alt="Shekh Faisal - Full screen"
              className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => (e.target.src = '/dmart.png')}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Developer;