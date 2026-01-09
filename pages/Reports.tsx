
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { googleSheetService } from '../services/googleSheetService';
import { Attendance, User, Roster } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const ReportsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [a, u] = await Promise.all([
      googleSheetService.fetchTable<Attendance>('Attendance'),
      googleSheetService.fetchTable<User>('Users')
    ]);
    setAttendance(a);
    setUsers(u);
    setLoading(false);
  };

  const filteredAttendance = attendance.filter(a => 
    currentUser?.role === 'Super Admin' ? true : users.find(u => u.user_id === a.user_id)?.city === currentUser?.city
  );

  // Stats: Monthly served
  const getMonthlyStats = () => {
    const stats: Record<string, number> = {};
    filteredAttendance.forEach(a => {
      const month = new Date(a.date).toLocaleString('default', { month: 'short' });
      stats[month] = (stats[month] || 0) + 1;
    });
    return Object.entries(stats).map(([name, count]) => ({ name, count }));
  };

  // Sunday vs Rehearsal
  const rehearsalSplit = [
    { name: 'Sunday Services', value: filteredAttendance.filter(a => !a.rehearsal).length },
    { name: 'Rehearsals', value: filteredAttendance.filter(a => a.rehearsal).length }
  ];

  const COLORS = ['#000000', '#D9D9D9'];

  if (loading) return <div className="text-center py-12">Generating Reports...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-brand-black">Department Reports</h1>
        <p className="text-gray-500">Data-driven insights for the sound department.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Activity */}
        <div className="bg-white p-6 rounded shadow-sm border border-brand-light">
          <h3 className="font-bold mb-6 text-gray-500 uppercase text-xs">Monthly Served Count</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getMonthlyStats()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#000000" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rehearsal vs Sunday */}
        <div className="bg-white p-6 rounded shadow-sm border border-brand-light">
          <h3 className="font-bold mb-6 text-gray-500 uppercase text-xs">Sunday vs Rehearsal Split</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rehearsalSplit}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {rehearsalSplit.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow-sm border border-brand-light">
        <h3 className="font-bold mb-4">Key Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border border-brand-light p-4 rounded bg-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase">Total Served</p>
            <p className="text-2xl font-bold">{filteredAttendance.length}</p>
          </div>
          <div className="border border-brand-light p-4 rounded bg-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase">Unique Volunteers</p>
            <p className="text-2xl font-bold">{new Set(filteredAttendance.map(a => a.user_id)).size}</p>
          </div>
          <div className="border border-brand-light p-4 rounded bg-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase">Avg Attendance/Week</p>
            <p className="text-2xl font-bold">{(filteredAttendance.length / 4).toFixed(1)}</p>
          </div>
          <div className="border border-brand-light p-4 rounded bg-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase">Campus Engagement</p>
            <p className="text-2xl font-bold">{( (new Set(filteredAttendance.map(a => a.user_id)).size / users.filter(u => u.city === currentUser?.city).length) * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
