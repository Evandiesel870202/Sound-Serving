
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { googleSheetService } from '../services/googleSheetService';
import { AdhocEvent, AdhocAvailability, User } from '../types';

const AdhocPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<AdhocEvent[]>([]);
  const [availabilities, setAvailabilities] = useState<AdhocAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [e, a] = await Promise.all([
      googleSheetService.fetchTable<AdhocEvent>('AdhocEvents'),
      googleSheetService.fetchTable<AdhocAvailability>('AdhocAvailability')
    ]);
    setEvents(e);
    setAvailabilities(a);
    setLoading(false);
  };

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEvent = {
      name: formData.get('name') as string,
      date: formData.get('date') as string,
      service_times: formData.get('times') as string
    };
    
    await googleSheetService.appendRow('AdhocEvents', newEvent);
    setShowCreate(false);
    fetchData();
  };

  const markAdhocAvailability = async (eventId: string, time: string) => {
    const existing = availabilities.find(a => 
      a.event_id === eventId && 
      a.user_id === currentUser?.user_id && 
      a.service_time === time
    );

    if (existing) return;

    const success = await googleSheetService.appendRow('AdhocAvailability', {
      event_id: eventId,
      user_id: currentUser?.user_id,
      service_time: time
    });

    if (success) {
      alert("Availability marked for event.");
      fetchData();
    }
  };

  if (loading) return <div className="text-center py-12">Loading Events...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-black">Adhoc Events</h1>
          <p className="text-gray-500">Special events, conferences, and training.</p>
        </div>
        {currentUser?.role === 'Super Admin' && (
          <button 
            onClick={() => setShowCreate(true)}
            className="bg-brand-black text-white px-4 py-2 rounded font-bold hover:bg-brand-dark flex items-center"
          >
            <i className="fa-solid fa-plus mr-2"></i> New Event
          </button>
        )}
      </div>

      {showCreate && (
        <div className="bg-white p-6 rounded shadow border border-brand-black max-w-lg">
          <h3 className="font-bold mb-4">Create Special Event</h3>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <input name="name" placeholder="Event Name" required className="w-full border p-2 rounded" />
            <input name="date" type="date" required className="w-full border p-2 rounded" />
            <input name="times" placeholder="Service Times (e.g. 09:00, 14:00)" required className="w-full border p-2 rounded" />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-brand-black text-white p-2 rounded">Create</button>
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 border p-2 rounded">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map(event => (
          <div key={event.event_id} className="bg-white p-6 rounded shadow-sm border border-brand-light">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{event.name}</h3>
                <p className="text-brand-dark font-medium">{new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
              </div>
              <i className="fa-solid fa-star text-brand-black"></i>
            </div>
            
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">Available Times</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {event.service_times.split(',').map(t => {
                const isSelected = availabilities.some(a => 
                  a.event_id === event.event_id && 
                  a.user_id === currentUser?.user_id && 
                  a.service_time === t.trim()
                );
                return (
                  <button
                    key={t}
                    onClick={() => markAdhocAvailability(event.event_id, t.trim())}
                    className={`px-3 py-2 rounded text-sm font-bold border transition-all
                      ${isSelected ? 'bg-green-600 text-white border-green-600' : 'bg-white border-brand-light hover:border-brand-black'}
                    `}
                  >
                    {t.trim()} {isSelected && <i className="fa-solid fa-check ml-1"></i>}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-brand-light flex justify-between items-center text-xs">
              <span className="text-gray-500">
                {availabilities.filter(a => a.event_id === event.event_id).length} Response(s)
              </span>
              <button className="text-brand-black font-bold hover:underline">View Full Roster</button>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-gray-400 italic">No upcoming adhoc events.</p>}
      </div>
    </div>
  );
};

export default AdhocPage;
