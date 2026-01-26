
import { GOOGLE_SHEET_WEB_APP_URL } from '../constants';

export const isConfigured = () => {
  return GOOGLE_SHEET_WEB_APP_URL && 
         GOOGLE_SHEET_WEB_APP_URL.startsWith("https://script.google.com") &&
         !GOOGLE_SHEET_WEB_APP_URL.includes("REPLACE_WITH_YOUR_APPS_SCRIPT_URL");
};

export const googleSheetService = {
  async fetchTable<T,>(sheetName: string): Promise<T[]> {
    try {
      if (!isConfigured()) {
        const localData = localStorage.getItem(`mock_sheet_${sheetName}`);
        return localData ? JSON.parse(localData) : [];
      }

      const url = `${GOOGLE_SHEET_WEB_APP_URL}?table=${sheetName}&t=${Date.now()}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`[CRC Admin] Fetch Error (${sheetName}):`, error);
      const localData = localStorage.getItem(`mock_sheet_${sheetName}`);
      return localData ? JSON.parse(localData) : [];
    }
  },

  async appendRow(sheetName: string, rowData: any): Promise<boolean> {
    try {
      if (!isConfigured()) {
        const localData = localStorage.getItem(`mock_sheet_${sheetName}`);
        const data = localData ? JSON.parse(localData) : [];
        const entry = { ...rowData, created_at: new Date().toISOString() };
        data.push(entry);
        localStorage.setItem(`mock_sheet_${sheetName}`, JSON.stringify(data));
        return true;
      }

      await fetch(GOOGLE_SHEET_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'append', table: sheetName, data: rowData })
      });

      return true;
    } catch (error) {
      console.error(`[CRC Admin] Append Error:`, error);
      return false;
    }
  },

  async batchAppend(sheetName: string, rows: any[]): Promise<boolean> {
    if (rows.length === 0) return true;
    try {
      if (!isConfigured()) {
        const localData = localStorage.getItem(`mock_sheet_${sheetName}`);
        const data = localData ? JSON.parse(localData) : [];
        localStorage.setItem(`mock_sheet_${sheetName}`, JSON.stringify([...data, ...rows]));
        return true;
      }

      await fetch(GOOGLE_SHEET_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'append', table: sheetName, data: rows })
      });

      return true;
    } catch (error) {
      console.error(`[CRC Admin] Batch Append Error:`, error);
      return false;
    }
  },

  async updateRow(sheetName: string, id: string, idColumn: string, rowData: any): Promise<boolean> {
    try {
      if (!isConfigured()) {
        const localData = localStorage.getItem(`mock_sheet_${sheetName}`);
        const data = localData ? JSON.parse(localData) : [];
        const index = data.findIndex((item: any) => String(item[idColumn]) === String(id));
        if (index !== -1) {
          data[index] = { ...data[index], ...rowData };
          localStorage.setItem(`mock_sheet_${sheetName}`, JSON.stringify(data));
          return true;
        }
        return false;
      }

      await fetch(GOOGLE_SHEET_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ 
          action: 'update', 
          table: sheetName, 
          id, 
          idColumn, 
          data: rowData 
        })
      });

      return true;
    } catch (error) {
      console.error(`[CRC Admin] Update Error:`, error);
      return false;
    }
  }
};
