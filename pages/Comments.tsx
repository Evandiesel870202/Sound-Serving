
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { googleSheetService } from '../services/googleSheetService';
import { VolunteerComment, User, City } from '../types';
import { CITY_FILTERS } from '../constants';

const CommentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<VolunteerComment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Added type assertion to allow comparison between 'City' and 'ALL' string
  const canSeeAll = currentUser?.role === 'Super Admin' || (currentUser?.city as string) === 'ALL';
  const [selectedCity, setSelectedCity] = useState<City | 'ALL'>(canSeeAll ? 'ALL' : (currentUser?.city || 'JHB'));
  
  const [newComment, setNewComment] = useState('');
  const [targetUserId, setTargetUserId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [c, u] = await Promise.all([
      googleSheetService.fetchTable<VolunteerComment>('VolunteerComments'),
      googleSheetService.fetchTable<User>('Users')
    ]);
    setComments(c);
    setUsers(u);
    setLoading(false);
  };

  const isAdmin = currentUser?.role !== 'Volunteer';
  
  const filteredUsers = users.filter(u => {
    if (canSeeAll) {
      return selectedCity === 'ALL' ? true : u.city === selectedCity;
    }
    return u.city === currentUser?.city;
  });

  const filteredComments = comments.filter(c => {
    if (canSeeAll) {
      return selectedCity === 'ALL' ? true : c.city === selectedCity;
    }
    return c.city === currentUser?.city;
  }).sort((a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime());

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !newComment) return;

    const targetUser = users.find(u => String(u.user_id) === String(targetUserId));
    if (!targetUser) return;

    const comment = {
      user_id: targetUserId,
      added_by: currentUser?.name + ' ' + currentUser?.surname,
      comment_text: newComment,
      date_added: new Date().toISOString(),
      city: targetUser.city // Always use the user's city
    };

    const success = await googleSheetService.appendRow('VolunteerComments', comment);
    if (success) {
      setNewComment('');
      setTargetUserId('');
      fetchData();
    }
  };

  const getUserName = (id: string) => {
    const u = users.find(u => String(u.user_id) === String(id));
    return u ? `${u.name} ${u.surname}` : 'Unknown';
  };

  if (loading) return <div className="text-center py-12">Loading Comments...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-black">Volunteer Feedback</h1>
          <p className="text-gray-500">Track mentorship, growth, and feedback.</p>
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

      {isAdmin && (
        <div className="bg-white p-6 rounded shadow-sm border border-brand-light">
          <h3 className="font-bold mb-4">Add New Comment</h3>
          <form onSubmit={handleAddComment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Select Volunteer</label>
                <select 
                  className="w-full border p-2 rounded"
                  value={targetUserId}
                  onChange={e => setTargetUserId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Person --</option>
                  {filteredUsers.map(u => <option key={u.user_id} value={u.user_id}>{u.name} {u.surname} ({u.city})</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Feedback Text</label>
              <textarea 
                className="w-full border p-2 rounded h-24"
                placeholder="How did they serve? Any growth areas?"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                required
              />
            </div>
            <button className="bg-brand-black text-white px-6 py-2 rounded font-bold hover:bg-brand-dark transition-colors">
              Submit Feedback
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-bold text-lg">Recent History</h3>
        {filteredComments.map(c => (
          <div key={c.comment_id} className="bg-white p-6 rounded shadow-sm border border-brand-light relative">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase text-brand-dark bg-brand-light px-2 py-0.5 rounded">
                  {getUserName(c.user_id)}
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">{c.city}</span>
              </div>
              <span className="text-xs text-gray-400">{new Date(c.date_added).toLocaleString()}</span>
            </div>
            <p className="text-brand-black mt-2">{c.comment_text}</p>
            <div className="mt-4 pt-4 border-t border-brand-light text-xs text-gray-500 italic">
              Added by: {c.added_by}
            </div>
          </div>
        ))}
        {filteredComments.length === 0 && <p className="text-gray-400 italic">No comments found.</p>}
      </div>
    </div>
  );
};

export default CommentsPage;
