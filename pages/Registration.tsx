
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { googleSheetService } from '../services/googleSheetService';
import { CITIES, SHIRT_SIZES, STATIONS } from '../constants';
import { City } from '../types';

const Registration: React.FC<{ onComplete: (email: string) => void }> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    cellphone: '',
    email: '',
    date_of_birth: '',
    zone_pastor: '',
    homecell_leader: '',
    shirt_size: '',
    main_station: '',
    city: 'JHB' as City,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const newUser = {
      ...formData,
      role: 'Volunteer',
      active_status: 'Active',
      created_at: new Date().toISOString()
    };

    const success = await googleSheetService.appendRow('Users', newUser);
    if (success) {
      alert("Registration successful!");
      onComplete(formData.email);
      navigate('/');
    } else {
      alert("Registration failed. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded shadow-2xl border-t-8 border-brand-dark p-8">
        <h1 className="text-3xl font-bold mb-2">Volunteer Registration</h1>
        <p className="text-gray-500 mb-8 border-b pb-4">Join the CRC Sound Department team.</p>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">First Name</label>
              <input required type="text" className="w-full border border-brand-light p-2 rounded" 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Surname</label>
              <input required type="text" className="w-full border border-brand-light p-2 rounded" 
                value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Email</label>
              <input required type="email" className="w-full border border-brand-light p-2 rounded" 
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Cellphone</label>
              <input required type="tel" className="w-full border border-brand-light p-2 rounded" 
                value={formData.cellphone} onChange={e => setFormData({...formData, cellphone: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Date of Birth</label>
              <input required type="date" className="w-full border border-brand-light p-2 rounded" 
                value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">City/Campus</label>
              <select className="w-full border border-brand-light p-2 rounded" 
                value={formData.city} onChange={e => setFormData({...formData, city: e.target.value as City})}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Main Station Interest</label>
              <select className="w-full border border-brand-light p-2 rounded" 
                value={formData.main_station} onChange={e => setFormData({...formData, main_station: e.target.value})}>
                <option value="">Select Station</option>
                {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Shirt Size</label>
              <select className="w-full border border-brand-light p-2 rounded" 
                value={formData.shirt_size} onChange={e => setFormData({...formData, shirt_size: e.target.value})}>
                <option value="">Select Size</option>
                {SHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Zone Pastor</label>
              <input type="text" className="w-full border border-brand-light p-2 rounded" 
                value={formData.zone_pastor} onChange={e => setFormData({...formData, zone_pastor: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Homecell Leader</label>
              <input type="text" className="w-full border border-brand-light p-2 rounded" 
                value={formData.homecell_leader} onChange={e => setFormData({...formData, homecell_leader: e.target.value})} />
            </div>
          </div>

          <div className="md:col-span-2 pt-4 flex items-center justify-between">
            <Link to="/login" className="text-brand-dark hover:underline">Back to Login</Link>
            <button 
              type="submit" 
              disabled={submitting}
              className="bg-brand-black text-white px-8 py-3 rounded font-bold hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registration;
