import React, { useState } from 'react';
import { MagnifyingGlassIcon, ExclamationTriangleIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useConcerns } from '../hooks/useConcerns';
import type { Concern, AuditEntry } from '../hooks/useConcerns';
import { format, differenceInDays } from 'date-fns';

export default function StatusTracker() {
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState<Concern | null>(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { fetchConcernById, error: fetchError } = useConcerns();

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;

    setSearching(true);
    setNotFound(false);
    setResult(null);
    
    try {
      const found = await fetchConcernById(searchInput.trim().toUpperCase());
      if (found) {
        setResult(found);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error('Tracking failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const steps = ['Submitted', 'Routed', 'Read', 'Screened', 'Resolved'];
  const currentIndex = result 
    ? (result.status === 'Escalated' ? steps.indexOf('Screened') : steps.indexOf(result.status))
    : -1;

  const getDaysOpen = (date: string) => differenceInDays(new Date(), new Date(date));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl shadow-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">Track your concern</h2>
        
        <form onSubmit={handleTrack} className="flex space-x-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-[#4b5563]" />
            </div>
            <input 
              type="text" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Reference ID (e.g., CON-1234)"
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg pl-11 pr-4 py-3 text-white placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            />
          </div>
          <button 
            type="submit"
            disabled={searching}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            {searching ? 'Searching...' : 'Track'}
          </button>
        </form>

        {!result && !notFound && !searching && (
          <div className="mt-12 mb-4 flex flex-col items-center justify-center text-center">
            <MagnifyingGlassIcon className="w-12 h-12 text-gray-600 mb-4" />
            <p className="text-white font-medium">Enter your concern reference ID to track its status</p>
            <p className="text-gray-500 text-sm mt-1">Example: CON-1234</p>
          </div>
        )}

        {notFound && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">No concern found with ID <span className="font-bold">{searchInput}</span>. Please check the ID and try again.</p>
          </div>
        )}

        {fetchError && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{fetchError}</p>
          </div>
        )}
      </div>

      {result && !searching && (
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="p-8 border-b border-[#2a2d3a] relative">
            <span className={`absolute top-8 right-8 px-3 py-1 border rounded-full text-xs font-semibold uppercase tracking-wider ${
              result.status === 'Resolved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
              result.status === 'Escalated' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            }`}>
              {result.status}
            </span>

            <h3 className="text-2xl font-bold mb-1 text-white">{result.concern_number}</h3>
            <p className="text-white font-semibold mb-1">{result.title}</p>
            <p className="text-[#9ca3af] text-sm mb-4">Submitted {format(new Date(result.submitted_at), 'MMM dd, yyyy')}</p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm mt-6">
              <span className="text-[#9ca3af] flex items-center">
                <span className="font-semibold text-white mr-2">Dept:</span> {result.department}
              </span>
              <span className="text-[#2a2d3a]">|</span>
              <span className="text-[#9ca3af] flex items-center">
                <span className="font-semibold text-white mr-2">Category:</span>
                <span className="w-2 h-2 rounded-full bg-blue-400 mr-2"></span> 
                {result.category}
              </span>
              <span className="text-[#2a2d3a]">|</span>
              <span className={`flex items-center font-medium ${getDaysOpen(result.submitted_at) > 2 ? 'text-red-400' : 'text-green-400'}`}>
                Open for: {getDaysOpen(result.submitted_at)} days
              </span>
            </div>

            {result.status === 'Escalated' && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm leading-relaxed font-medium">
                  Your concern has been escalated to a supervisor due to an SLA breach. An update is expected within 24 hours.
                </p>
              </div>
            )}
          </div>

          <div className="p-8 border-b border-[#2a2d3a] overflow-x-auto">
            <div className="min-w-[600px] py-4">
              <div className="flex items-center justify-between relative px-4">
                <div className="absolute left-6 right-6 top-4 h-[2px] bg-[#2a2d3a] -z-10"></div>
                
                {steps.map((step, idx) => {
                  const isCompleted = idx <= currentIndex;
                  const isEscalatedStep = idx === steps.indexOf('Screened') && result.status === 'Escalated';

                  return (
                    <div key={step} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-4 border-[#1a1d27] flex items-center justify-center text-white z-10 transition-all ${
                        isEscalatedStep ? 'bg-red-500' :
                        isCompleted ? 'bg-green-500' :
                        'bg-[#2a2d3a]'
                      }`}>
                        {isEscalatedStep ? <span className="font-bold text-sm">!</span> :
                         isCompleted ? <CheckIcon className="w-4 h-4" /> : null}
                      </div>
                      <span className={`text-[11px] font-medium mt-3 uppercase tracking-wider ${
                        isEscalatedStep ? 'text-red-400' :
                        isCompleted ? 'text-white' :
                        'text-[#4b5563]'
                      }`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-8">
            <h4 className="text-sm font-semibold text-[#9ca3af] uppercase tracking-wider mb-8">Activity Timeline</h4>
            
            <div className="relative pl-6 space-y-10 before:absolute before:inset-y-2 before:left-[11px] before:w-px before:bg-[#2a2d3a]">
              
              {result.audit_trail?.slice().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((entry: AuditEntry, idx: number) => {
                let dotColor = 'bg-green-500';
                if (entry.action.includes('Escalated')) dotColor = 'bg-red-500';
                else if (entry.action.includes('Read') || entry.action.includes('Screened')) dotColor = 'bg-amber-500';
                else if (entry.action.includes('Routed') || entry.action.includes('Submitted')) dotColor = 'bg-blue-500';
                else dotColor = 'bg-gray-400';

                return (
                  <div key={entry.id || idx} className="relative">
                    <span className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-[3px] border-[#1a1d27] ${dotColor}`}></span>
                    
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start ml-2">
                      <div>
                        <h5 className="font-bold text-white text-base">{entry.action}</h5>
                        <p className="text-[13px] text-[#9ca3af] mt-1.5 flex items-center gap-2">
                          <span className="text-gray-500">{entry.actor}</span>
                          {entry.note && (
                            <>
                              <span>·</span>
                              <span className="italic text-[#6b7280]">"{entry.note}"</span>
                            </>
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-[#6b7280] font-medium tracking-wide mt-2 sm:mt-0">
                        {format(new Date(entry.timestamp), 'MMM dd, yyyy · h:mm a').toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
