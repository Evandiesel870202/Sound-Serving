
import { GOOGLE_SHEET_WEB_APP_URL } from '../constants';

/**
 * Note for developers:
 * This service expects a Google Apps Script web app deployed with:
 * doGet(e) { 
 *   // returns JSON of all data or specific table 
 * }
 * doPost(e) {
 *   // handles appendRow for specific table
 * }
 */

export const googleSheetService = {
  async fetchTable<T,>(sheetName: string): Promise<T[]> {
    try {
      // In a real scenario, this would be a real URL.
      // For this implementation, we will mock data if the URL is not set correctly.
      if (GOOGLE_SHEET_WEB_APP_URL.includes("REPLACE_WITH_YOUR")) {
        console.warn("Google Sheet URL not configured. Returning local storage mock data.");
        const localData = localStorage.getItem(`mock_sheet_${sheetName}`);
        return localData ? JSON.parse(localData) : [];
      }

      const response = await fetch(`${GOOGLE_SHEET_WEB_APP_URL}?table=${sheetName}`);
      if (!response.ok) throw new Error("Failed to fetch sheet data");
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${sheetName}:`, error);
      return [];
    }
  },

  async appendRow(sheetName: string, rowData: any): Promise<boolean> {
    try {
      if (GOOGLE_SHEET_WEB_APP_URL.includes("https://docs.google.com/spreadsheets/d/1RSJTFo0aFj87FdL3ndYWNSEsSyiZX1IJ8Utgvo5sj4w/edit?gid=0#gid=0")) {
        const localData = localStorage.getItem(`mock_sheet_${sheetName}`);
        const data = localData ? JSON.parse(localData) : [];
        const newRow = { ...rowData, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
        data.push(newRow);
        localStorage.setItem(`mock_sheet_${sheetName}`, JSON.stringify(data));
        return true;
      }

      const response = await fetch(GOOGLE_SHEET_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors', // Apps Script web app often requires no-cors if not handling pre-flight
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'append', table: sheetName, data: rowData })
      });
      return true; // no-cors doesn't give us the real result, assume success or use a more robust proxy
    } catch (error) {
      console.error(`Error appending to ${sheetName}:`, error);
      return false;
    }
  },

  async updateRow(sheetName: string, id: string, idColumn: string, rowData: any): Promise<boolean> {
    // Similar to append, but for updates
    if (GOOGLE_SHEET_WEB_APP_URL.includes("https://docs.google.com/spreadsheets/d/1RSJTFo0aFj87FdL3ndYWNSEsSyiZX1IJ8Utgvo5sj4w/edit?gid=0#gid=0")) {
      const localData = localStorage.getItem(`mock_sheet_${sheetName}`);
      const data = localData ? JSON.parse(localData) : [];
      const index = data.findIndex((item: any) => item[idColumn] === id);
      if (index !== -1) {
        data[index] = { ...data[index], ...rowData };
        localStorage.setItem(`mock_sheet_${sheetName}`, JSON.stringify(data));
        return true;
      }
      return false;
    }
    // Web app logic for update...
    return true;
  }
};
