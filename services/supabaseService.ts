
// Mocking Supabase Service logic for this implementation environment
// In a real environment, you'd import { createClient } from '@supabase/supabase-js'

export const supabaseService = {
  async fetchTable<T>(tableName: string, filters: any = {}): Promise<T[]> {
    const localKey = `db_${tableName}`;
    const localData = localStorage.getItem(localKey);
    let data = localData ? JSON.parse(localData) : [];
    
    // Seed some data for certain tables if they are empty
    if (data.length === 0 && tableName === 'Users') {
        data = [{
            user_id: 'super-admin-001',
            name: 'Super',
            surname: 'Admin',
            cellphone: '0721128230',
            email: 'admin@crcsound.co.za',
            role: 'Super Admin',
            city: 'ALL',
            status: 'Active',
            active_status: 'Active',
            popia_consent: true,
            main_station: 'FOH',
            created_at: new Date().toISOString()
        }];
        localStorage.setItem(localKey, JSON.stringify(data));
    }

    if (data.length === 0 && tableName === 'AdhocEvents') {
      data = [{
        event_id: 'conf-2025',
        name: 'Dreamweek 2025',
        date: '2025-10-15',
        service_times: '09:00, 14:00, 19:00'
      }];
      localStorage.setItem(localKey, JSON.stringify(data));
    }
    
    // Simple mock filtering
    Object.keys(filters).forEach(key => {
      data = data.filter((item: any) => String(item[key]) === String(filters[key]));
    });
    
    return data;
  },

  async upsert<T>(tableName: string, record: Partial<T>, idKey: string = 'id'): Promise<T | null> {
    const localKey = `db_${tableName}`;
    const localData = localStorage.getItem(localKey);
    let data = localData ? JSON.parse(localData) : [];
    
    const idValue = (record as any)[idKey];
    const index = data.findIndex((item: any) => String(item[idKey]) === String(idValue));
    
    let result: T;
    if (index !== -1) {
      data[index] = { ...data[index], ...record };
      result = data[index];
    } else {
      const newRecord = { 
        ...record, 
        [idKey]: idValue || Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      };
      data.push(newRecord);
      result = newRecord as T;
    }
    
    localStorage.setItem(localKey, JSON.stringify(data));
    return result;
  },

  async delete(tableName: string, id: string, idKey: string = 'id'): Promise<boolean> {
    const localKey = `db_${tableName}`;
    const localData = localStorage.getItem(localKey);
    if (!localData) return false;
    let data = JSON.parse(localData);
    const newData = data.filter((item: any) => String(item[idKey]) !== String(id));
    localStorage.setItem(localKey, JSON.stringify(newData));
    return true;
  }
};
