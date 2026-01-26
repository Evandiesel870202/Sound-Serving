
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { googleSheetService } from '../services/googleSheetService';
import { Attendance, User, City } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { CITY_FILTERS } from '../constants';

const ReportsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Added type assertion to allow comparison between 'City' and 'ALL' string
  const canSeeAll = currentUser?.role === 'Super Admin' || (currentUser?.city as string) === 'ALL';
  const [selectedCity, setSelectedCity] = useState<City | 'ALL'>(canSeeAll ? 'ALL' : (currentUser?.city || 'JHB'));

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

  const filteredAttendance = attendance.filter(a => {
    const user = users.find(u => String(u.user_id) === String(a.user_id));
    if (!user) return false;
    
    if (canSeeAll) {
      return selectedCity === 'ALL' ? true : user.city === selectedCity;
    }
    return user.city === currentUser?.city;
  });

  const getMonthlyStats = () => {
    const stats: Record<string, number> = {};
    filteredAttendance.forEach(a => {
      const month = new Date(a.date).toLocaleString('default', { month: 'short' });
      stats[month] = (stats[month] || 0) + 1;
    });
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months
      .filter(m => stats[m] !== undefined)
      .map(name => ({ name, count: stats[name] }));
  };

  const rehearsalSplit = [
    { name: 'Sunday Services', value: filteredAttendance.filter(a => !a.rehearsal).length },
    { name: 'Rehearsals', value: filteredAttendance.filter(a => a.rehearsal).length }
  ];

  const COLORS = ['#000000', '#D9D9D9'];

  if (loading) return <div className="text-center py-12">Generating Reports...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-black">Department Reports</h1>
          <p className="text-gray-500">Data-driven insights for {selectedCity === 'ALL' ? 'all campuses' : `${selectedCity} campus`}.</p>
        </div>
        
        {canSeeAll && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase text-gray-400">Campus Filter</span>
            <select 
              className="border border-brand-light rounded p-2 bg-white font-bold"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value as City | 'ALL')}
            >
              {CITY_FILTERS.map(c => <option key={c} value={c}>{c === 'ALL' ? 'ALL CITIES' : c}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
        <h3 className="font-bold mb-4">Key Metrics ({selectedCity})</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border border-brand-light p-4 rounded bg-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase">Total Served</p>
            <p className="text-2xl font-bold">{filteredAttendance.length}</p>
          </div>
          <div className="border border-brand-light p-4 rounded bg-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase">Unique Volunteers</p>
            <p className="text-2xl font-bold">{new Set(filteredAttendance.map(a => String(a.user_id))).size}</p>
          </div>
          <div className="border border-brand-light p-4 rounded bg-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase">Avg Attendance/Week</p>
            <p className="text-2xl font-bold">{(filteredAttendance.length / 4).toFixed(1)}</p>
          </div>
          <div className="border border-brand-light p-4 rounded bg-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase">Campus Engagement</p>
            <p className="text-2xl font-bold">
              {users.length > 0 ? ( (new Set(filteredAttendance.map(a => String(a.user_id))).size / users.filter(u => selectedCity === 'ALL' ? true : u.city === selectedCity).length) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
