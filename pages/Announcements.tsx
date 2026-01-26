
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { googleSheetService } from '../services/googleSheetService';
import { Announcement, City } from '../types';
import { CITIES } from '../constants';

const AnnouncementsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const isAdmin = ['Super Admin', 'Admin', 'Section Leader', 'Staff'].includes(currentUser?.role || '');
  const isSuper = currentUser?.role === 'Super Admin';

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'General',
    event_date: '',
    city: currentUser?.city === 'ALL' ? 'JHB' : currentUser?.city as City,
    for_all: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const data = await googleSheetService.fetchTable<Announcement>('Announcements');
    setAnnouncements(data || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const entries = formData.for_all ? CITIES.map(c => ({ ...formData, city: c })) : [formData];
    
    for (const entry of entries) {
      await googleSheetService.appendRow('Announcements', entry);
    }
    
    setShowCreate(false);
    fetchData();
  };

  const filtered = announcements.filter(a => currentUser?.city === 'ALL' ? true : a.city === currentUser?.city);

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Announcements</h1>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-2">Latest updates from the Department</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="bg-brand-black text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">New Post</button>
        )}
      </div>

      {showCreate && (
        <div className="bg-white p-10 rounded-[3rem] border border-brand-light shadow-2xl max-w-2xl animate-in slide-in-from-top-4">
          <form onSubmit={handleCreate} className="space-y-6">
            <input required placeholder="Subject Line" className="w-full bg-gray-50 p-4 rounded-2xl font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <textarea required placeholder="Write your message..." className="w-full bg-gray-50 p-4 rounded-2xl font-bold h-32" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <select className="w-full bg-gray-50 p-4 rounded-2xl font-bold" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="General">General Comms</option>
                <option value="Social">Social / Event</option>
              </select>
              {formData.type === 'Social' && (
                <input type="date" className="w-full bg-gray-50 p-4 rounded-2xl font-bold" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} />
              )}
            </div>
            {isSuper && (
              <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl cursor-pointer">
                <input type="checkbox" checked={formData.for_all} onChange={e => setFormData({...formData, for_all: e.target.checked})} />
                <span className="text-xs font-black uppercase">Post to all campuses?</span>
              </label>
            )}
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-4 font-black uppercase text-[10px]">Cancel</button>
              <button type="submit" className="flex-1 bg-brand-black text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Publish</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {filtered.reverse().map(a => (
          <div key={a.id} className="bg-white p-8 rounded-[2.5rem] border border-brand-light shadow-sm flex gap-8">
            <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center shrink-0">
               <i className={`fa-solid ${a.type === 'Social' ? 'fa-calendar-heart' : 'fa-bullhorn'} text-xl`}></i>
            </div>
            <div className="space-y-2">
               <div className="flex items-center gap-3">
                 <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-brand-black text-white rounded">{a.type}</span>
                 <span className="text-[9px] font-black uppercase text-gray-400">{a.city}</span>
               </div>
               <h3 className="text-xl font-black tracking-tighter uppercase">{a.title}</h3>
               <p className="text-gray-500 leading-relaxed">{a.content}</p>
               {a.event_date && (
                 <p className="text-xs font-black uppercase bg-gray-50 inline-block px-3 py-1 rounded-lg border border-brand-light">Date: {new Date(a.event_date).toDateString()}</p>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
