import { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useConcerns } from '../hooks/useConcerns';
import type { Concern, ConcernStatus, AuditEntry } from '../hooks/useConcerns';
import type { CurrentUser } from '../hooks/useAuth';
import { format } from 'date-fns';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  concern: Concern | null;
  currentUser: CurrentUser;
}

export default function ConcernDetailDrawer({ isOpen, onClose, concern, currentUser }: DrawerProps) {
  const [noteText, setNoteText] = useState('');
  const [noteAdded, setNoteAdded] = useState(false);
  const [statusUpdated, setStatusUpdated] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const { updateConcernStatus, addAuditNote, loading } = useConcerns();

  // Clear states when drawer opens/closes or concern changes
  useEffect(() => {
    setNoteText('');
    setNoteAdded(false);
    setStatusUpdated(null);
    setLocalError(null);
  }, [isOpen, concern?.id]);

  if (!isOpen || !concern) return null;

  const handleStatusUpdate = async (newStatus: ConcernStatus) => {
    setLocalError(null);
    try {
      await updateConcernStatus(concern.id, newStatus, currentUser.fullName);
      setStatusUpdated(newStatus);
      setTimeout(() => {
        setStatusUpdated(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to update status');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setLocalError(null);
    try {
      await addAuditNote(concern.id, currentUser.fullName, noteText.trim());
      setNoteText('');
      setNoteAdded(true);
      setTimeout(() => setNoteAdded(false), 2000);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to add note');
    }
  };

  const nextActions: Record<string, ConcernStatus[]> = {
    Submitted: ['Read', 'Escalated'],
    Routed: ['Read', 'Escalated'],
    Read: ['Screened', 'Escalated'],
    Screened: ['Resolved', 'Escalated'],
    Escalated: ['Resolved'],
    Resolved: []
  };

  const currentAvailableActions = nextActions[concern.status] || [];
  const isEscalated = concern.status === 'Escalated';
  const isResolved = concern.status === 'Resolved';

  const slaDays = Math.floor((Date.now() - new Date(concern.submitted_at).getTime()) / (1000 * 60 * 60 * 24));

  const getDotColor = (action: string) => {
    if (action.includes('Escalated')) return 'bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.2)]';
    if (action.includes('Resolved')) return 'bg-green-500';
    if (action.includes('Read') || action.includes('Screened')) return 'bg-amber-500';
    if (action.includes('Submitted') || action.includes('Routed')) return 'bg-blue-500';
    return 'bg-gray-400'; // Notes or others
  };

  const getActionButtonStyle = (action: string) => {
    switch (action) {
      case 'Read': return 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10';
      case 'Screened': return 'border-amber-500/30 text-amber-500 hover:bg-amber-500/10';
      case 'Resolved': return 'border-green-500/30 text-green-500 hover:bg-green-500/10';
      case 'Escalated': return 'border-red-500/30 text-red-400 hover:bg-red-500/10';
      default: return 'border-[#2a2d3a] text-white hover:bg-[#2a2d3a]';
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div 
        className={`fixed inset-y-0 right-0 w-full md:w-[480px] bg-[#1a1d27] border-l border-[#2a2d3a] shadow-2xl z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        
        {/* Header */}
        <div className="flex flex-col p-6 border-b border-[#2a2d3a] relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 -mr-2 -mt-2 text-[#9ca3af] hover:text-white hover:bg-[#2a2d3a] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <span className="text-[#9ca3af] text-sm font-medium">{concern.concern_number}</span>
          <h2 className="text-xl font-bold text-white mt-1 pr-8">{concern.title}</h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Status/Success Messages */}
          {statusUpdated && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
              <p className="text-green-400 text-sm font-medium">Status updated to {statusUpdated}</p>
            </div>
          )}

          {localError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{localError}</p>
            </div>
          )}
          
          {/* Badges Row */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-2.5 py-1 text-xs font-bold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">{concern.category}</span>
            <span className="px-2.5 py-1 text-xs font-bold rounded bg-gray-500/10 text-gray-400 border border-gray-500/20 uppercase tracking-widest">{concern.department}</span>
            <span className={`px-2.5 py-1 text-xs font-bold rounded border flex items-center gap-1.5 uppercase tracking-widest ${
              isEscalated ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
              isResolved ? 'bg-green-500/10 text-green-500 border-green-500/20' :
              'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            }`}>
              {(isEscalated || isResolved) && <span className={`w-1.5 h-1.5 rounded-full ${isEscalated ? 'bg-red-500' : 'bg-green-500'}`}></span>}
              {concern.status}
            </span>
          </div>

          {/* SLA Banner */}
          {!isResolved && (
            <div className={`mb-6 px-4 py-2 border rounded-lg text-sm font-bold ${slaDays > 5 ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
              Open for {slaDays} days · {slaDays > 5 ? 'SLA Breached' : 'Within SLA'}
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-2">Description</h4>
            <p className="text-[#9ca3af] text-sm leading-relaxed whitespace-pre-wrap">
              {concern.description}
            </p>
          </div>

          {/* Student Info */}
          <div className="mb-6 pt-4 border-t border-[#2a2d3a]">
            <p className="text-sm text-[#6b7280]">
              Submitted by: <span className="text-[#9ca3af] font-medium">{concern.student_name} ({concern.student_number})</span>
            </p>
            <p className="text-xs text-[#4b5563] mt-1 italic">
              Program: {concern.program}
            </p>
          </div>

          <hr className="border-[#2a2d3a] my-6" />

          {/* Status Actions */}
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-white mb-3">Update status:</h4>
            {isResolved ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <p className="text-green-400 text-sm font-medium">This concern has been resolved.</p>
              </div>
            ) : currentAvailableActions.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {currentAvailableActions.map(action => (
                  <button 
                    key={action}
                    disabled={loading}
                    onClick={() => handleStatusUpdate(action)}
                    className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${getActionButtonStyle(action)}`}
                  >
                    {loading ? 'Updating...' : `Mark as ${action}`}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No further actions available.</p>
            )}
          </div>

          {/* Add Note */}
          <div className="mb-8">
             <h4 className="text-sm font-semibold text-white mb-3">Internal Note:</h4>
            <textarea 
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              placeholder="Add an internal note visible only to staff..."
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors mb-2 resize-none"
            ></textarea>
            <div className="flex justify-between items-center">
              {noteAdded ? <span className="text-green-400 text-xs font-bold flex items-center gap-1"><CheckCircleIcon className="w-4 h-4" /> Note added!</span> : <div />}
              <button 
                onClick={handleAddNote}
                disabled={!noteText.trim() || loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors text-sm"
              >
                {loading ? 'Adding...' : 'Add note'}
              </button>
            </div>
          </div>

          <hr className="border-[#2a2d3a] my-8" />

          {/* Activity Timeline */}
          <div>
            <h4 className="text-sm font-semibold text-[#9ca3af] uppercase tracking-wider mb-6">Activity Timeline</h4>
            <div className="relative pl-5 space-y-8 before:absolute before:inset-y-1 before:left-[7px] before:w-px before:bg-[#2a2d3a]">
              
              {concern.audit_trail?.slice().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((entry: AuditEntry, idx: number) => {
                const dotColor = getDotColor(entry.action);

                return (
                  <div key={entry.id || idx} className="relative">
                    <span className={`absolute -left-[25px] top-1.5 w-3 h-3 rounded-full border-[2px] border-[#1a1d27] ${dotColor}`}></span>
                    
                    <div className="flex flex-col ml-1">
                      <h5 className="font-bold text-white text-[13px]">{entry.action}</h5>
                      <div className="flex flex-col text-[#6b7280] text-[11px] mt-1 space-y-0.5 font-medium">
                         <span>{format(new Date(entry.timestamp), 'MMM dd, yyyy · h:mm a').toUpperCase()} <span className="mx-1">·</span> {entry.actor}</span>
                         {entry.note && <span className="italic text-[#4b5563]">"{entry.note}"</span>}
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        </div>

      </div>
    </>
  );
}
