import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, CheckSquare, Filter, Settings, FileText, LayoutGrid, List, AlertCircle, ChevronRight, X } from 'lucide-react';

// --- Default Data from your snippet ---
// This ensures the app works immediately with the data you provided.
const DEFAULT_CSV_DATA = `Subject,August Y1,September Y1,October Y1,November Y1,December Y1,January Y1,February Y1,March Y1,April Y1,May Y1,June Y1,,August Y2,September Y2,October Y2,November Y2,December Y2,January Y2,February Y2,March Y2,April Y2,IB EXAMS
English Language and Literature,Instruction,Instruction,Examination Paper,Instruction,Examination Paper,,,,,,IA or External Assessment,,Examination Paper,HL Essay Work Time,HL Essay (Draft) Due for Feedback,"HL Essay (Final) Due, Examination Paper",IA or External Assessment,,,,
Portuguese Language and Literature,Instruction,Instruction,Instruction,Instruction,Examination Paper,,Instruction,Instruction,Instruction,IA (Draft) Due for Feedback,IA or External Assessment,,HL Essay (Draft) Due for Feedback,HL Essay (Final) Due,Examination Paper,IA Work time,IA or External Assessment,Instruction,Instruction,Examination Paper,Examination Paper
French B,Instruction,Instruction,Instruction,Instruction,,IA Work time,IA (Draft) Due for Feedback,IA (Final) Delivered,,,,,,,,,,,,,
Spanish B,Instruction,Instruction,IA (Draft) Due for Feedback,IA (Final) Delivered,,Instruction,Instruction,Instruction,,,,,,,,,,,,,
Brazilian Social Studies,"Instruction, IA Work time",Instruction,Instruction,Instruction,Examination Paper,"Instruction, IA Work time",Instruction,Instruction,Instruction,Instruction,Examination Paper,,"IA Work time, Instruction",IA Work time,"IA Work time, Instruction",IA (Draft) Due for Feedback,Examination Paper,Instruction,IA (Final) Delivered,Instruction,Instruction
Math Apps SL,Instruction,Instruction,Instruction,Instruction,Examination Paper,Instruction,Instruction,Instruction,Instruction,Instruction,Examination Paper,,Instruction,Instruction,IA Work time,"IA Work time, IA (Draft) Due for Feedback",Examination Paper,IA (Final) Delivered,Instruction,Instruction,Examination Paper
Computer Science,"Instruction, Examination Paper",Instruction,Examination Paper,Instruction,Examination Paper,Instruction,Instruction,Examination Paper,Instruction,Instruction,Examination Paper,,Instruction,IA Work time,"Instruction, IA Work time","IA Work time, IA (Draft) Due for Feedback",Examination Paper,"Instruction, IA Work time",IA (Final) Delivered,Examination Paper,Examination Paper
Visual Arts,Instruction,Instruction,Instruction,External Assessment (Draft) due for Feedback,Examination Paper,IA Work time,IA (Draft) Due for Feedback,External Assessment (Final) delivered,IA (Final) Delivered,Instruction,,,Instruction,Instruction,Instruction,External Assessment (Draft) due for Feedback,Examination Paper,IA Work time,IA Work time,External Assessment (Final) delivered,IA (Final) Delivered
Theory of Knowledge,Instruction,Instruction,Instruction,Instruction,IA or External Assessment,IA Work time,IA Work time,IA (Draft) Due for Feedback,IA (Final) Delivered,Instruction,IA or External Assessment,,Instruction,External Assessment Work Time,External Assessment (Draft) due for Feedback,External Assessment (Final) delivered,IA or External Assessment,,,,,`;

// --- Utility Functions ---

const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  // Helper to handle CSV values with commas inside quotes
  const splitLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const subjects = [];
  
  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    if (cols.length < 2) continue; // Skip empty lines

    const subjectName = cols[0];
    const schedule = {};

    // Map columns to months
    for (let j = 1; j < headers.length; j++) {
      // Handle the empty column gap usually found in these sheets
      const monthName = headers[j] || "Summer Break"; 
      if (!monthName) continue;

      const event = cols[j] ? cols[j].replace(/^"|"$/g, '') : ""; // Remove wrapping quotes
      if (event) {
        schedule[j] = {
          month: monthName,
          event: event,
          type: getEventType(event)
        };
      }
    }
    subjects.push({ name: subjectName, schedule });
  }

  // Extract unique months for columns
  const monthOrder = headers.slice(1).map((m, idx) => ({ name: m || "Summer Break", index: idx + 1 }));

  return { subjects, monthOrder };
};

// Determine severity/color based on keywords
const getEventType = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes('final') || lower.includes('exam') || lower.includes('delivered')) return 'high';
  if (lower.includes('draft') || lower.includes('feedback')) return 'medium';
  if (lower.includes('work time') || lower.includes('ia')) return 'low';
  return 'instruction';
};

// --- Components ---

const EventBadge = ({ type, text }) => {
  const styles = {
    high: "bg-red-100 text-red-800 border-red-200 font-semibold",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    low: "bg-blue-50 text-blue-700 border-blue-200",
    instruction: "bg-gray-50 text-gray-500 border-gray-100 opacity-60"
  };

  // Strip "Instruction" if it's mixed with other things to save space, 
  // unless it's the only thing
  let displayText = text;
  if (type !== 'instruction' && text.includes('Instruction')) {
     displayText = text.replace(/,?\s*Instruction/gi, '').trim();
     displayText = displayText.replace(/^,\s*/, ''); // Cleanup leading comma
  }

  return (
    <div className={`text-xs p-1.5 rounded border mb-1 ${styles[type] || styles.instruction}`}>
      {displayText}
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  // --- State ---
  const [rawData, setRawData] = useState(DEFAULT_CSV_DATA);
  const [parsedData, setParsedData] = useState({ subjects: [], monthOrder: [] });
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'grid'
  const [showInstruction, setShowInstruction] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Effects ---
  useEffect(() => {
    const data = parseCSV(rawData);
    setParsedData(data);
    // Default select all subjects initially, or first 6? Let's select all to show data.
    // Actually for a user friendly view, let's select first 3 by default to not overwhelm
    if (data.subjects.length > 0 && selectedSubjects.length === 0) {
        setSelectedSubjects(data.subjects.map(s => s.name));
    }
  }, [rawData]);

  // --- Handlers ---
  const toggleSubject = (name) => {
    setSelectedSubjects(prev => 
      prev.includes(name) 
        ? prev.filter(s => s !== name)
        : [...prev, name]
    );
  };

  const handleDataUpdate = (e) => {
    e.preventDefault();
    const newData = e.target.csvInput.value;
    setRawData(newData);
    setIsSettingsOpen(false);
  };

  // --- Computed ---
  const filteredSubjects = useMemo(() => {
    return parsedData.subjects.filter(s => selectedSubjects.includes(s.name));
  }, [parsedData, selectedSubjects]);

  const activeMonths = useMemo(() => {
     return parsedData.monthOrder.filter(m => m.name !== '');
  }, [parsedData]);

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-8 h-8 text-blue-300" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">IB Assessment Calendar</h1>
              <p className="text-blue-200 text-sm">Class of 2027 • Interactive Planner</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-blue-800 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${viewMode === 'timeline' ? 'bg-white text-blue-900 shadow' : 'text-blue-200 hover:text-white'}`}
            >
              <List size={18} />
              <span className="text-sm font-medium">Timeline</span>
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-blue-900 shadow' : 'text-blue-200 hover:text-white'}`}
            >
              <LayoutGrid size={18} />
              <span className="text-sm font-medium">Grid</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Controls Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <Filter size={18} />
              <span>Select Subjects:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {parsedData.subjects.map(sub => (
                <button
                  key={sub.name}
                  onClick={() => toggleSubject(sub.name)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    selectedSubjects.includes(sub.name)
                      ? 'bg-blue-100 border-blue-300 text-blue-800 font-semibold'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0">
             <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <div className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showInstruction} 
                  onChange={(e) => setShowInstruction(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
              <span>Show Instruction Days</span>
            </label>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Settings & Data"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-600 px-2">
            <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></span>
                <span>Final / Exam / Due</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300"></span>
                <span>Draft / Feedback</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-50 border border-blue-300"></span>
                <span>Work Time</span>
            </div>
            {showInstruction && (
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-gray-50 border border-gray-300"></span>
                    <span>Instruction</span>
                </div>
            )}
        </div>

        {/* Views */}
        {selectedSubjects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-600">No subjects selected</h3>
            <p className="text-gray-400">Select your subjects above to see your assessment calendar.</p>
          </div>
        ) : (
          <>
            {/* Timeline View (Vertical) */}
            {viewMode === 'timeline' && (
              <div className="space-y-6">
                {activeMonths.map((m) => {
                  const monthEvents = filteredSubjects.map(sub => {
                    const eventData = sub.schedule[m.index];
                    if (!eventData) return null;
                    if (!showInstruction && eventData.type === 'instruction') return null;
                    return { subject: sub.name, ...eventData };
                  }).filter(Boolean);

                  if (monthEvents.length === 0) return null;

                  return (
                    <div key={m.index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2">
                         <span className="font-bold text-gray-700">{m.name}</span>
                         {m.name.includes("Summer") && <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">Break</span>}
                      </div>
                      <div className="divide-y divide-gray-50">
                        {monthEvents.map((evt, idx) => (
                          <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <div className="md:w-1/4 font-semibold text-sm text-slate-700">{evt.subject}</div>
                            <div className="flex-1">
                                <EventBadge type={evt.type} text={evt.event} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Grid View (Horizontal Table) */}
            {viewMode === 'grid' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-20 bg-gray-100 border-b border-r border-gray-200 p-3 text-left font-bold text-gray-700 w-48 min-w-[12rem] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Subject</th>
                        {activeMonths.map((m) => (
                          <th key={m.index} className="bg-gray-50 border-b border-gray-200 p-3 text-left font-semibold text-gray-600 min-w-[10rem] whitespace-nowrap">
                            {m.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSubjects.map(sub => (
                        <tr key={sub.name} className="hover:bg-gray-50">
                          <td className="sticky left-0 z-10 bg-white border-r border-gray-200 p-3 font-medium text-gray-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            {sub.name}
                          </td>
                          {activeMonths.map((m) => {
                             const evt = sub.schedule[m.index];
                             if (!evt || (!showInstruction && evt.type === 'instruction')) {
                                 return <td key={m.index} className="p-2 border-r border-gray-50 bg-gray-50/30"></td>;
                             }
                             return (
                               <td key={m.index} className="p-2 border-r border-gray-100 align-top">
                                  <EventBadge type={evt.type} text={evt.event} />
                               </td>
                             );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Settings Modal */}
      <Modal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        title="Settings & Data Source"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            The calendar is powered by CSV data. You can paste updated data below to refresh the calendar. 
            Ensure the format matches: first row as headers (Months), first column as Subjects.
          </p>
          <form onSubmit={handleDataUpdate}>
            <textarea 
              name="csvInput"
              className="w-full h-64 p-3 font-mono text-xs border rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              defaultValue={rawData}
            />
            <div className="flex justify-end gap-3 mt-4">
               <button 
                type="button"
                onClick={() => setRawData(DEFAULT_CSV_DATA)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Reset to Default
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Update Calendar
              </button>
            </div>
          </form>
        </div>
      </Modal>

    </div>
  );
};

export default App;
