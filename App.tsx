
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { User, Role, City } from './types';
import { googleSheetService, isConfigured } from './services/googleSheetService';
import * as XLSX from 'xlsx';

// Import Pages
import Dashboard from './pages/Dashboard';
import AvailabilityPage from './pages/Availability';
import RosterPage from './pages/Roster';
import AttendancePage from './pages/Attendance';
import AdhocPage from './pages/Adhoc';
import CommentsPage from './pages/Comments';
import ReportsPage from './pages/Reports';
import BirthdaysPage from './pages/Birthdays';
import Registration from './pages/Registration';
import AnnouncementsPage from './pages/Announcements';

// Context
interface AuthContextType {
  currentUser: User | null;
  login: (cellphone: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  register: (userData: Partial<User>) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: async () => false,
  logout: () => {},
  loading: true,
  register: async () => false,
  refreshUserData: async () => {}
});

export const useAuth = () => useContext(AuthContext);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    const users = await googleSheetService.fetchTable<User>('Users');
    
    // Auto-seed admin if no users exist (local mode)
    if (users.length === 0 && !isConfigured()) {
      const admin = {
        name: 'Super',
        surname: 'Admin',
        cellphone: '0721128230',
        email: 'admin@crcsound.co.za',
        role: 'Super Admin',
        city: 'ALL',
        status: 'Active',
        active_status: 'Active',
        popia_consent: true,
        user_id: 'super-admin-001',
        created_at: new Date().toISOString()
      };
      await googleSheetService.appendRow('Users', admin);
    }

    const savedPhone = localStorage.getItem('user_phone');
    if (savedPhone) {
      await login(savedPhone);
    }
    setLoading(false);
  };

  const refreshUserData = async () => {
    if (!currentUser) return;
    const users = await googleSheetService.fetchTable<User>('Users');
    const updated = users.find(u => u.user_id === currentUser.user_id);
    if (updated) setCurrentUser(updated);
  };

  const login = async (cellphone: string) => {
    const users = await googleSheetService.fetchTable<User>('Users');
    const user = users.find(u => u.cellphone === cellphone && (u.status === 'Active' || u.active_status === 'Active'));
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('user_phone', cellphone);
      return true;
    }
    return false;
  };

  const register = async (userData: Partial<User>) => {
    const newUser = {
      ...userData,
      status: 'Active',
      active_status: 'Active',
      role: 'Volunteer',
      user_id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    const success = await googleSheetService.appendRow('Users', newUser);
    if (success) {
      setCurrentUser(newUser as User);
      localStorage.setItem('user_phone', newUser.cellphone || '');
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user_phone');
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center text-white font-black tracking-tighter text-6xl animate-pulse">
      CRC SOUND
    </div>
  );

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading, register, refreshUserData }}>
      <HashRouter>
        <Routes>
          {!currentUser ? (
            <>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<Registration onComplete={(email) => console.log('Registered', email)} />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          ) : (
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="availability" element={<AvailabilityPage />} />
              <Route path="roster" element={<RosterPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="adhoc" element={<AdhocPage />} />
              <Route path="birthdays" element={<BirthdaysPage />} />
              <Route path="comments" element={<CommentsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="training" element={<TrainingPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="volunteers" element={<VolunteersTable />} />
              <Route path="all-things-sound" element={<AllThingsSound />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Route>
          )}
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
};

// --- AUTH PAGES ---

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    const success = await login(phone);
    if (success) navigate('/');
    else alert('Account not found or inactive. Try: 0721128230');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl">
        <h1 className="text-4xl font-black mb-2 tracking-tighter uppercase text-center">CRC SOUND</h1>
        <p className="text-gray-400 mb-8 font-medium text-center">Enter your mobile number to begin.</p>
        <input 
          type="tel" 
          placeholder="072 000 0000"
          className="w-full border-2 border-gray-100 p-4 rounded-2xl mb-4 focus:border-black outline-none transition-all font-bold"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <button 
          onClick={handleLogin}
          className="w-full bg-brand-black text-white p-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl"
        >
          Sign In
        </button>
        <div className="mt-8 text-center">
          <Link to="/register" className="text-xs font-black text-gray-400 hover:text-black uppercase tracking-widest transition-colors">
            New Volunteer? Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};

// --- LAYOUT & NAVIGATION ---

const Layout = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const isLinked = isConfigured();

  const role = currentUser?.role || 'Volunteer';

  const menu = [
    { path: '/', label: 'DASHBOARD', icon: 'fa-house', roles: ['ALL'] },
    { path: '/availability', label: 'AVAILABILITY', icon: 'fa-calendar-day', roles: ['ALL'] },
    { path: '/attendance', label: 'ATTENDANCE', icon: 'fa-user-check', roles: ['ALL'] },
    { path: '/training', label: 'TRAINING', icon: 'fa-graduation-cap', roles: ['ALL'] },
    { path: '/announcements', label: 'ANNOUNCEMENTS', icon: 'fa-bullhorn', roles: ['ALL'] },
    
    // Leadership & Management
    { path: '/roster', label: 'ROSTER', icon: 'fa-clipboard-list', roles: ['Super Admin', 'Admin', 'Section Leader', 'Staff'] },
    { path: '/adhoc', label: 'ADHOC EVENTS', icon: 'fa-star', roles: ['Super Admin', 'Admin', 'Section Leader', 'Staff'] },
    { path: '/volunteers', label: 'VOLUNTEERS', icon: 'fa-users', roles: ['Super Admin', 'Admin', 'Section Leader', 'Staff', '2IC'] },
    { path: '/comments', label: 'FEEDBACK', icon: 'fa-comment-dots', roles: ['Super Admin', 'Admin', 'Section Leader', 'Staff'] },
    { path: '/reports', label: 'REPORTS', icon: 'fa-chart-pie', roles: ['Super Admin', 'Admin', 'Section Leader', 'Staff'] },
    { path: '/birthdays', label: 'BIRTHDAYS', icon: 'fa-cake-candles', roles: ['Super Admin', 'Admin', 'Section Leader', 'Staff'] },
    
    // Super Admin only
    { path: '/settings', label: 'SETTINGS', icon: 'fa-palette', roles: ['Super Admin'] },
  ];

  const visibleMenu = menu.filter(item => 
    item.roles.includes('ALL') || item.roles.includes(role)
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-72 bg-brand-black text-white p-8 flex flex-col fixed inset-y-0 overflow-y-auto no-scrollbar transition-colors duration-500">
        <h2 className="text-3xl font-black tracking-tighter mb-12 uppercase">CRC SOUND</h2>
        
        <div className="mb-6 flex items-center space-x-2 bg-white/5 p-3 rounded-xl border border-white/10">
          <div className={`w-2 h-2 rounded-full ${isLinked ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></div>
          <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
            {isLinked ? 'Cloud Sync Active' : 'Offline / Local Mode'}
          </span>
        </div>

        <nav className="flex-1 space-y-1">
          {visibleMenu.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex items-center space-x-4 p-4 rounded-2xl transition-all group ${
                location.pathname === item.path 
                ? 'bg-brand-white text-brand-black font-black shadow-lg shadow-black/10' 
                : 'text-white/50 hover:text-brand-white hover:bg-brand-white/10'
              }`}
            >
              <i className={`fa-solid ${item.icon} w-5`}></i>
              <span className="text-[10px] font-black tracking-[0.15em] uppercase">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-12 border-t border-brand-white/10 pt-8 pb-4">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-white/10 flex items-center justify-center font-black text-xs uppercase">
              {currentUser?.name?.[0]}{currentUser?.surname?.[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black text-brand-white/80 uppercase tracking-widest truncate">{currentUser?.name} {currentUser?.surname}</p>
              <p className="text-[9px] font-bold text-brand-white/40 uppercase">{currentUser?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="w-full bg-brand-white/5 p-4 rounded-2xl text-red-400 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
          >
            <i className="fa-solid fa-power-off mr-2"></i>
            Sign Out
          </button>
        </div>
      </aside>
      <main className="ml-72 flex-1 p-12 bg-[#FBFBFB]">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// (Rest of additional pages remain the same, simplified to keep context clear)
const TrainingPage = () => (
  <div className="space-y-12">
    <h1 className="text-4xl font-black uppercase tracking-tighter">Training Modules</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[
        { title: 'Front of House (FOH) Basics', duration: '45 mins', icon: 'fa-sliders' },
        { title: 'Monitor Mixing Masterclass', duration: '60 mins', icon: 'fa-headphones' },
        { title: 'Digital Console Routing', duration: '30 mins', icon: 'fa-network-wired' },
        { title: 'Wireless Microphone Care', duration: '20 mins', icon: 'fa-microphone' },
      ].map(course => (
        <div key={course.title} className="bg-white p-10 rounded-[3rem] border border-brand-light shadow-sm group hover:border-brand-black transition-all cursor-pointer">
          <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-black group-hover:text-white transition-all">
             <i className={`fa-solid ${course.icon} text-xl`}></i>
          </div>
          <h3 className="font-black text-sm uppercase mb-2">{course.title}</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{course.duration}</p>
        </div>
      ))}
    </div>
  </div>
);

const VolunteersTable = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const data = await googleSheetService.fetchTable<User>('Users');
    setUsers(data || []);
    setLoading(false);
  };

  const filtered = users.filter(u => currentUser?.city === 'ALL' ? true : u.city === currentUser?.city);

  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-black uppercase tracking-tighter">Volunteer Database</h2>
      <div className="bg-white rounded-[3rem] shadow-sm border border-brand-light overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-brand-black text-white text-[10px] uppercase tracking-widest font-black">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Station</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-light">
            {filtered.map(u => (
              <tr key={u.user_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-xs">{u.name} {u.surname}</p>
                  <p className="text-[9px] text-gray-400 uppercase font-black">{u.role} • {u.city}</p>
                </td>
                <td className="px-6 py-4 text-xs font-bold">{u.main_station}</td>
                <td className="px-6 py-4 text-xs font-bold">{u.cellphone}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AllThingsSound = () => (
  <div className="space-y-12">
    <h1 className="text-4xl font-black uppercase tracking-tighter">All Things Sound</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[
        { title: 'FOH Standard Operating Procedures', type: 'PDF' },
        { title: 'Monitor Mixing Guide 2025', type: 'PDF' },
        { title: 'Broadcast Routing Map', type: 'IMAGE' },
        { title: 'Mothers & Toddlers Sound Setup', type: 'PDF' },
      ].map(doc => (
        <div key={doc.title} className="bg-white p-10 rounded-[3rem] border border-brand-light shadow-sm group hover:border-brand-black transition-all cursor-pointer">
          <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-black group-hover:text-white transition-all">
             <i className="fa-solid fa-file-pdf text-xl"></i>
          </div>
          <h3 className="font-black text-sm uppercase mb-2">{doc.title}</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{doc.type} Document</p>
        </div>
      ))}
    </div>
  </div>
);

const SettingsPage = () => {
  const [image, setImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentColors, setCurrentColors] = useState({ primary: '#000000', accent: '#000000', light: '#F5F5F5' });

  const rgbToHex = (r: number, g: number, b: number) => "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  const adjustColor = (hex: string, percent: number) => {
    let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, Math.max(0, Math.floor(r * (1 + percent))));
    g = Math.min(255, Math.max(0, Math.floor(g * (1 + percent))));
    b = Math.min(255, Math.max(0, Math.floor(b * (1 + percent))));
    return rgbToHex(r, g, b);
  };

  const downloadTemplate = () => {
    const workbook = XLSX.utils.book_new();

    const sheets = {
      'Users': ['user_id', 'name', 'surname', 'gender', 'ethnicity', 'cellphone', 'email', 'suburb', 'date_of_birth', 'city', 'homecell_member', 'crc_member', 'zone_pastor', 'zone', 'shirt_size', 'main_station', 'start_date', 'role', 'status', 'active_status', 'popia_consent', 'created_at'],
      'Availability': ['id', 'user_id', 'month', 'year', 'date', 'is_available', 'service_times', 'rehearsal_available', 'city'],
      'Roster': ['roster_id', 'date', 'city', 'station', 'building', 'volunteer_1', 'volunteer_2', 'runner', 'shadow'],
      'Attendance': ['id', 'user_id', 'date', 'service_time', 'rehearsal', 'building', 'captured_by'],
      'Announcements': ['id', 'city', 'title', 'content', 'type', 'event_date'],
      'AdhocEvents': ['event_id', 'name', 'date', 'service_times'],
      'AdhocAvailability': ['id', 'event_id', 'user_id', 'service_time'],
      'VolunteerComments': ['comment_id', 'user_id', 'added_by', 'comment_text', 'date_added', 'city'],
      'Training': ['id', 'city', 'name', 'station', 'due_date', 'description', 'url']
    };

    Object.entries(sheets).forEach(([name, headers]) => {
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      XLSX.utils.book_append_sheet(workbook, ws, name);
    });

    XLSX.writeFile(workbook, 'CRC_Sound_Admin_Template.xlsx');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setImage(src);
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = 100; canvas.height = 100;
        ctx.drawImage(img, 0, 0, 100, 100);
        const data = ctx.getImageData(0, 0, 100, 100).data;
        let r=0, g=0, b=0;
        for (let i=0; i<data.length; i+=4) { r+=data[i]; g+=data[i+1]; b+=data[i+2]; }
        const p = rgbToHex(Math.floor(r/(data.length/4)), Math.floor(g/(data.length/4)), Math.floor(b/(data.length/4)));
        applyTheme(p, p);
      };
    };
    reader.readAsDataURL(file);
  };

  const applyTheme = (primary: string, accent: string) => {
    const theme = { '--brand-black': primary, '--brand-dark': adjustColor(primary, -0.6), '--brand-accent': accent, '--brand-light': adjustColor(primary, 0.9), '--brand-white': '#FFFFFF' };
    localStorage.setItem('crc_custom_theme', JSON.stringify(theme));
    Object.keys(theme).forEach(key => document.documentElement.style.setProperty(key, (theme as any)[key]));
    setCurrentColors({ primary, accent, light: theme['--brand-light'] });
  };

  const resetTheme = () => {
    localStorage.removeItem('crc_custom_theme');
    window.location.reload();
  };

  return (
    <div className="space-y-12">
      <h2 className="text-4xl font-black uppercase tracking-tighter">Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-12 rounded-[3rem] border border-brand-light shadow-sm space-y-8">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest mb-6">Database Management</h4>
            <p className="text-gray-400 text-xs mb-6">Download the master template with all required tables and headers for Sunday rosters and volunteer tracking.</p>
            <button 
              onClick={downloadTemplate}
              className="w-full bg-brand-black text-white py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl"
            >
              <i className="fa-solid fa-file-excel text-lg"></i>
              Download Excel Database Template
            </button>
          </div>

          <div className="pt-8 border-t border-brand-light">
            <h4 className="text-xs font-black uppercase tracking-widest mb-6">Dynamic Branding</h4>
            <div className="border-4 border-dashed border-brand-light rounded-[2.5rem] p-12 text-center relative group overflow-hidden">
              <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              {image ? <img src={image} className="w-32 h-32 object-cover rounded-2xl mx-auto shadow-2xl" /> : <i className="fa-solid fa-camera text-4xl text-brand-light"></i>}
              <p className="mt-6 text-[10px] font-black uppercase tracking-widest">Upload 2025 Branding Image</p>
            </div>
            <button onClick={resetTheme} className="w-full mt-6 py-4 font-black uppercase text-[10px] tracking-widest bg-gray-100 rounded-2xl">Reset to CRC Default</button>
          </div>
        </div>

        <div className="bg-white p-12 rounded-[3rem] border border-brand-light shadow-sm flex flex-col justify-center space-y-4">
           <h4 className="text-xs font-black uppercase tracking-widest mb-4">Active Theme Schema</h4>
           {Object.entries(currentColors).map(([k, v]) => (
             <div key={k} className="flex items-center space-x-4 bg-gray-50 p-5 rounded-2xl">
                <div className="w-12 h-12 rounded-xl border-2 border-white shadow-sm" style={{ backgroundColor: v }}></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{k}</p>
                  <p className="text-xs font-black uppercase tracking-widest">{v}</p>
                </div>
             </div>
           ))}
           <div className="mt-8 p-6 bg-brand-light rounded-2xl">
             <p className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed text-center">
               The database template is optimized for Google Sheets. Ensure you follow the "Web App Deployment" instructions in the service code.
             </p>
           </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default App;
