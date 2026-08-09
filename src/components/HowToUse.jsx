// src/components/HowToUse.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const HowToUse = () => {
  const sections = [
    {
      title: '🔐 Getting Started',
      steps: [
        'Register as a new cashier using your unique Cashier ID and branch.',
        'Login with your Cashier ID and password.',
        'If you forget your password, use the <Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link> link and follow the two‑step verification (Name + ID) to reset it.',
      ],
    },
    {
      title: '📊 Dashboard Overview',
      steps: [
        'The <Link to="/dashboard" className="text-primary hover:underline">Dashboard</Link> shows your monthly summary: total bill, total received, net variance, total discrepancy, and closing count.',
        'The <strong>“Entries Today”</strong> counter shows how many reports you’ve added today.',
        '“Today’s Closing” shows the latest entry (if any).',
        '“Recent Closings” lists your last 5 entries – click <Link to="/all-reports" className="text-primary hover:underline">View all</Link> to see all reports.',
        'The weekly revenue chart helps you track daily performance.',
      ],
    },
    {
      title: '📝 Adding a Daily Closing',
      steps: [
        'Go to <Link to="/closing" className="text-primary hover:underline">Closing Report</Link> from the sidebar.',
        'The date is locked to today – you can only add or update today’s report.',
        'Optionally enter the bill amount (auto‑calculates if left blank).',
        'Enter cash, UPI, and card amounts.',
        'If you have excess or short, fill those fields (excess decreases the bill, short increases it).',
        'The “Total” and “Computed Bill” are shown automatically.',
        'Click “Save Report” – the system will notify you if variance exceeds 150 (notification) or 200 (charge).',
        'Use the <strong>“Duplicate Last”</strong> button to copy the previous day’s values (date stays today).',
      ],
    },
    {
      title: '📋 Viewing & Filtering Reports',
      steps: [
        'The <Link to="/closing" className="text-primary hover:underline">Closing Report</Link> page also includes filters: by date range, month (25th to 25th), or year.',
        'Use “CSV” and “PDF” buttons to download reports with totals.',
        'The <Link to="/all-reports" className="text-primary hover:underline">All Reports</Link> page shows all your entries with search, date, and status filters.',
        'You can select specific rows using the checkboxes and export only the selected entries (CSV/PDF).',
        'A summary of totals (Total Bill, Received, Net Variance, Excess, Short) is displayed at the top.',
      ],
    },
    {
      title: '📅 Period Reports',
      steps: [
        'Go to <Link to="/period-report" className="text-primary hover:underline">Period Report</Link> from the sidebar.',
        'Choose between <strong>Week</strong>, <strong>Month</strong>, or <strong>Year</strong> views.',
        'The report shows aggregated totals – for Week: daily breakdown, for Month: weekly totals, for Year: monthly totals.',
        'Use the navigation arrows (◀ ▶) to move between periods.',
        'Export the report as <strong>CSV</strong> or <strong>PDF</strong> for your records.',
      ],
    },
    {
      title: '👨‍💻 Developer & System Pages',
      steps: [
        'The <Link to="/developer" className="text-primary hover:underline">Developer</Link> page introduces the creator and provides a contact form.',
        'Use the <strong>contact form</strong> to send feedback, report bugs, or suggest features – messages go to the admin.',
        'You can see your <strong>Conversations</strong> (messages you’ve sent and admin replies) directly on the Developer page.',
        'The <Link to="/system" className="text-primary hover:underline">System</Link> page shows technical details: API status, database health, tech stack, and API endpoint documentation.',
        'Both pages are useful for understanding the app’s infrastructure and getting support.',
      ],
    },
    {
      title: '🔔 Notifications & Profile',
      steps: [
        'The bell icon in the header shows notifications for variances ≥150 (with icon, charge, or reward).',
        'Click the bell to view notifications by month.',
        'Click your avatar/name in the header to open the profile dropdown.',
        'From there, you can <Link to="/change-password" className="text-primary hover:underline">change your password</Link> or log out.',
        'The dropdown also shows your Cashier ID, Branch, and the last login time.',
      ],
    },
    {
      title: '📱 Install the App (PWA)',
      steps: [
        'The app is a Progressive Web App – you can install it on your device for a native experience.',
        'Click the three dots (⋮) in the header → “Installation Guide”.',
        'Select your device (Desktop, Android, or iOS) and follow the steps.',
        'You can also scan the QR code to open the app on your phone.',
      ],
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">📖 How to Use D‑Mart Cashier</h2>
      <p className="text-sm text-gray-500 mb-6">
        Everything you need to know about using the cashier portal.
      </p>

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{section.title}</h3>
              <ol className="space-y-2 list-decimal list-inside text-sm text-gray-700">
                {section.steps.map((step, i) => (
                  <li
                    key={i}
                    className="leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: step }}
                  />
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
        <p className="text-sm text-blue-700">
          💡 Need more help? Contact your administrator or refer to the printed manual.
        </p>
      </div>
    </div>
  );
};

export default HowToUse;