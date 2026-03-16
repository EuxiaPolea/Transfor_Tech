import { useState, useRef, useEffect } from 'react';
import { 
  ArrowDownTrayIcon, 
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useConcerns } from '../hooks/useConcerns';
import type { Concern } from '../hooks/useConcerns';
import type { CurrentUser } from '../hooks/useAuth';
import ConcernDetailDrawer from './ConcernDetailDrawer';
import { differenceInDays, format } from 'date-fns';
import Papa from 'papaparse';
import jsPDF from 'jspdf';

interface AdminDashboardProps {
  user: CurrentUser;
}

const getDaysOpen = (submittedAt: string) =>
  differenceInDays(new Date(), new Date(submittedAt));

const getSLAStatus = (concern: Concern) => {
  const days = getDaysOpen(concern.submitted_at);
  if (concern.status === 'Resolved') return 'resolved';
  if (days > 5) return 'critical';
  if (days > 2) return 'warning';
  return 'ok';
};

const getSLAColor = (concern: Concern) => {
  const sla = getSLAStatus(concern);
  if (sla === 'critical') return 'text-red-400';
  if (sla === 'warning') return 'text-amber-400';
  if (sla === 'resolved') return 'text-gray-500';
  return 'text-green-400';
};

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const { fetchConcerns, concerns, updateConcernStatus, loading } = useConcerns();
  const [selectedConcern, setSelectedConcern] = useState<Concern | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const data = await fetchConcerns();
      if (data) checkAndEscalateSLA(data);
    };
    init();
  }, []);

  const checkAndEscalateSLA = async (concerns: Concern[]) => {
    const now = new Date();
    for (const concern of concerns) {
      if (concern.status === 'Resolved' || concern.status === 'Escalated') continue;

      const daysOpen = differenceInDays(now, new Date(concern.submitted_at));

      // Rule 1: Submitted or Routed for more than 2 days
      if (['Submitted', 'Routed'].includes(concern.status) && daysOpen >= 2) {
        await updateConcernStatus(
          concern.id,
          'Escalated',
          'System',
          `SLA breach — concern was ${concern.status} for ${daysOpen} days without action`
        );
      }

      // Rule 2: Read but not Screened for more than 5 days
      if (concern.status === 'Read' && daysOpen >= 5) {
        await updateConcernStatus(
          concern.id,
          'Escalated',
          'System',
          `SLA breach — concern was Read for ${daysOpen} days without screening`
        );
      }
    }
  };

  // Close filter panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node)) {
        const toggleBtn = document.getElementById('filter-toggle-btn');
        if (toggleBtn && !toggleBtn.contains(event.target as Node)) {
          setIsFilterPanelOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter concerns by department if user is a standard admin
  const deptConcerns = user.role === 'superadmin' 
    ? concerns 
    : concerns.filter(c => c.department === user.department);

  // Filtered Concerns (for display)
  const filteredConcerns = deptConcerns
    .filter(c => searchTerm === '' || c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.concern_number.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(c => selectedCategory === 'All' || c.category === selectedCategory)
    .filter(c => activeStatus === 'All' || c.status === activeStatus);

  // Metrics (based on department concerns)
  const totalConcerns = deptConcerns.length;
  const resolved = deptConcerns.filter(c => c.status === 'Resolved').length;
  const escalated = deptConcerns.filter(c => c.status === 'Escalated').length;
  
  const resolvedConcerns = concerns.filter(c => c.status === 'Resolved');
  const avgDays = resolvedConcerns.length > 0
    ? (resolvedConcerns.reduce((sum, c) =>
        sum + differenceInDays(new Date(c.updated_at), new Date(c.submitted_at)), 0
      ) / resolvedConcerns.length).toFixed(1)
    : '0';

  const escalationRate = totalConcerns > 0 ? ((escalated / totalConcerns) * 100).toFixed(1) + '%' : '0%';
  const resolutionRate = totalConcerns > 0 ? Math.round((resolved / totalConcerns) * 100) + '%' : '0%';

  // SLA Warnings
  const breachedCount = concerns.filter(c => getSLAStatus(c) === 'critical' && c.status !== 'Resolved').length;

  // Chart Data
  const statusCounts = ['Resolved','Screened','Routed','Escalated','Submitted']
    .map(status => ({
      label: status,
      count: concerns.filter(c => c.status === status).length,
      color: ({
        Resolved: 'bg-green-500',
        Screened: 'bg-amber-500',
        Routed: 'bg-blue-500',
        Escalated: 'bg-red-500',
        Submitted: 'bg-gray-500'
      } as Record<string, string>)[status]
    }));
  const maxCount = Math.max(...statusCounts.map(s => s.count), 1);

  const categoryCounts = {
    Academic: concerns.filter(c => c.category === 'Academic').length,
    Welfare: concerns.filter(c => c.category === 'Welfare').length,
    Financial: concerns.filter(c => c.category === 'Financial').length,
  };
  const totalCat = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
  const categoryPct = {
    Academic: totalCat > 0 ? Math.round(categoryCounts.Academic / totalCat * 100) : 0,
    Welfare: totalCat > 0 ? Math.round(categoryCounts.Welfare / totalCat * 100) : 0,
    Financial: totalCat > 0 ? Math.round(categoryCounts.Financial / totalCat * 100) : 0,
  };

  // Export CSV
  const exportCSV = () => {
    setExportLoading(true);
    const csvData = filteredConcerns.map(c => ({
      'Concern ID': c.concern_number,
      'Title': c.title,
      'Category': c.category,
      'Department': c.department,
      'Status': c.status,
      'Student Name': c.is_anonymous ? 'Anonymous' : c.student_name,
      'Student Number': c.student_number,
      'Program': c.program,
      'Submitted At': format(new Date(c.submitted_at), 'MMM dd, yyyy h:mm a'),
      'Days Open': getDaysOpen(c.submitted_at),
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ConcernTrack_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExportLoading(false);
  };

  // Export PDF
  const exportPDF = () => {
    setExportLoading(true);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ConcernTrack Report', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy h:mm a')}`, pageWidth / 2, 28, { align: 'center' });

    // Metrics summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Concerns: ${totalConcerns}`, 14, 50);
    doc.text(`Resolved: ${resolved} (${resolutionRate})`, 14, 57);
    doc.text(`Escalated: ${escalated} (${escalationRate})`, 14, 64);
    doc.text(`Avg Response Time: ${avgDays} days`, 14, 71);

    // Table header
    let y = 85;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ID', 14, y);
    doc.text('Title', 35, y);
    doc.text('Category', 100, y);
    doc.text('Status', 130, y);
    doc.text('Days Open', 160, y);
    doc.line(14, y + 2, pageWidth - 14, y + 2);

    // Table rows
    doc.setFont('helvetica', 'normal');
    concerns.forEach((c) => {
      y += 8;
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(c.concern_number, 14, y);
      doc.text(c.title.substring(0, 35), 35, y);
      doc.text(c.category, 100, y);
      doc.text(c.status, 130, y);
      doc.text(String(getDaysOpen(c.submitted_at)), 160, y);
    });

    doc.save(`ConcernTrack_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    setExportLoading(false);
  };

  const statuses = ["All", "Submitted", "Routed", "Read", "Screened", "Escalated", "Resolved"];

  return (
    <div className="w-full">
      {/* SLA Alert Banner */}
      {breachedCount > 0 && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 animate-pulse">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
          <p className="text-amber-400 text-sm font-bold">
            ⚠ {breachedCount} concern(s) need attention — SLA has been breached. Check escalated items below.
          </p>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Admin dashboard</h2>
          <p className="text-[#9ca3af] mt-1 font-medium tracking-wide">AY 2025–2026 · Semester 2</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={exportCSV}
            disabled={exportLoading}
            className="px-4 py-2 border border-[#2a2d3a] text-white rounded-lg hover:bg-[#1a1d27] font-medium transition-all flex items-center text-sm disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            {exportLoading ? 'Exporting...' : 'Export CSV'}
          </button>
          <button 
            onClick={exportPDF}
            disabled={exportLoading}
            className="px-4 py-2 border border-[#2a2d3a] text-white rounded-lg hover:bg-[#1a1d27] font-medium transition-all flex items-center text-sm disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            {exportLoading ? 'Exporting...' : 'Export PDF'}
          </button>
          <button 
            onClick={() => fetchConcerns()}
            className="px-4 py-2 border border-[#2a2d3a] text-white rounded-lg hover:bg-[#1a1d27] font-medium transition-all flex items-center text-sm"
          >
            <ArrowPathIcon className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            id="filter-toggle-btn"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`px-4 py-2 border ${isFilterPanelOpen ? 'border-indigo-500 text-indigo-400 ring-1 ring-indigo-500/50' : 'border-[#2a2d3a] text-white hover:bg-[#1a1d27]'} rounded-lg font-medium transition-all flex items-center text-sm`}
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Slide-down Filter Panel */}
      {isFilterPanelOpen && (
        <div 
          ref={filterPanelRef}
          className="mb-8 p-6 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl shadow-2xl animate-in slide-in-from-top-4 duration-200"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4b5563] mb-3">Filter by Status</label>
              <div className="flex flex-wrap gap-2">
                {statuses.map(status => (
                  <button
                    key={status}
                    onClick={() => setActiveStatus(status)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      activeStatus === status 
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' 
                        : 'bg-[#0f1117] border-[#2a2d3a] text-[#9ca3af] hover:border-[#4b5563]'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4b5563] mb-3">Category</label>
                <div className="relative">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    <option>All</option>
                    <option>Academic</option>
                    <option>Financial</option>
                    <option>Welfare</option>
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-2.5 w-4 h-4 text-[#4b5563] pointer-events-none" />
                </div>
              </div>
              <button 
                onClick={() => { setActiveStatus('All'); setSelectedCategory('All'); setIsFilterPanelOpen(false); }}
                className="px-6 py-2 border border-[#2a2d3a] text-[#9ca3af] hover:text-white rounded-lg text-sm transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#1a1d27] border border-[#2a2d3a] p-6 rounded-xl">
          <h3 className="text-[#9ca3af] text-sm font-medium mb-1">Total Concerns</h3>
          <p className="text-3xl font-bold text-white mb-2">{totalConcerns}</p>
          <p className="text-xs text-indigo-400 font-medium tracking-tight">System lifetime</p>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] p-6 rounded-xl">
          <h3 className="text-[#9ca3af] text-sm font-medium mb-1">Avg Response</h3>
          <p className="text-3xl font-bold text-white mb-2">{avgDays} days</p>
          <p className="text-xs text-green-400 font-medium tracking-tight">Submission to Resolution</p>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] p-6 rounded-xl">
          <h3 className="text-[#9ca3af] text-sm font-medium mb-1">Escalation Rate</h3>
          <p className="text-3xl font-bold text-white mb-2">{escalationRate}</p>
          <p className="text-xs text-red-400 font-medium tracking-tight">{escalated} flagged items</p>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] p-6 rounded-xl">
          <h3 className="text-[#9ca3af] text-sm font-medium mb-1">Resolution Rate</h3>
          <p className="text-3xl font-bold text-white mb-2">{resolutionRate}</p>
          <p className="text-xs text-[#9ca3af] font-medium tracking-tight">{resolved} / {totalConcerns} closed</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#1a1d27] border border-[#2a2d3a] p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Concerns by status</h3>
          <div className="space-y-4">
            {statusCounts.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1"><span className="text-[#9ca3af]">{s.label}</span><span className="font-medium text-white">{s.count}</span></div>
                <div className="w-full bg-[#0f1117] rounded-full h-2">
                  <div className={`h-2 rounded-full ${s.color}`} style={{ width: `${(s.count / maxCount * 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1a1d27] border border-[#2a2d3a] p-6 rounded-xl flex flex-col sm:flex-row items-center justify-between">
          <div className="w-full sm:w-1/2 mb-6 sm:mb-0">
             <h3 className="text-lg font-semibold text-white mb-6">Category split</h3>
             <ul className="space-y-3">
               <li className="flex items-center text-sm"><span className="w-3 h-3 rounded-full bg-purple-500 mr-3"></span><span className="text-[#9ca3af] flex-1">Academic</span><span className="text-white font-medium">{categoryPct.Academic}%</span></li>
               <li className="flex items-center text-sm"><span className="w-3 h-3 rounded-full bg-teal-500 mr-3"></span><span className="text-[#9ca3af] flex-1">Welfare</span><span className="text-white font-medium">{categoryPct.Welfare}%</span></li>
               <li className="flex items-center text-sm"><span className="w-3 h-3 rounded-full bg-blue-500 mr-3"></span><span className="text-[#9ca3af] flex-1">Financial</span><span className="text-white font-medium">{categoryPct.Financial}%</span></li>
             </ul>
          </div>
          <div className="relative w-40 h-40 flex items-center justify-center rounded-full border-[16px] border-[#0f1117] shadow-[inset_0_0_0_16px_rgba(99,102,241,0.2)]">
             <div className="bg-[#1a1d27] w-full h-full rounded-full flex flex-col items-center justify-center z-10 absolute inset-[16px]">
              <span className="text-2xl font-bold text-white">{totalConcerns}</span>
              <span className="text-xs text-[#9ca3af]">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search ID or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1d27] border border-[#2a2d3a] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Concerns Table */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
             <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
             <p className="text-[#9ca3af] text-sm animate-pulse">Loading concerns...</p>
          </div>
        ) : filteredConcerns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-[#4b5563]">
            <ClipboardDocumentIcon className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium opacity-50">No concerns found</p>
             <p className="text-xs opacity-40 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#9ca3af]">
              <thead className="text-xs text-[#9ca3af] uppercase bg-[#0f1117]/50 border-b border-[#2a2d3a]">
                <tr>
                  <th className="px-6 py-4 font-semibold text-center w-24">ID</th>
                  <th className="px-6 py-4 font-semibold">Concern</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Department</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">SLA</th>
                </tr>
              </thead>
              <tbody>
                {filteredConcerns.map((c) => {
                  const slaColor = getSLAColor(c);
                  const daysOpen = getDaysOpen(c.submitted_at);
                  const isResolved = c.status === 'Resolved';

                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => setSelectedConcern(c)}
                      className="border-b border-[#2a2d3a]/50 hover:bg-[#1e2130] transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-bold text-white text-center">{c.concern_number}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white truncate max-w-[200px]">{c.title}</div>
                        <div className="text-[11px] text-[#4b5563] mt-0.5">{new Date(c.submitted_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full border uppercase tracking-widest ${
                          c.category === 'Academic' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          c.category === 'Financial' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-teal-500/10 text-teal-400 border-teal-500/20'
                        }`}>
                          {c.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-[#9ca3af]">{c.department}</td>
                      <td className="px-6 py-4 text-xs">
                        <div className="flex items-center space-x-2">
                           <span className={`w-2 h-2 rounded-full ${
                             c.status === 'Resolved' ? 'bg-green-500' :
                             c.status === 'Escalated' ? 'bg-red-500' :
                             c.status === 'Screened' ? 'bg-amber-500' :
                             c.status === 'Read' ? 'bg-blue-500' :
                             'bg-gray-400'
                           }`}></span>
                           <span className="font-bold text-white/90">{c.status}</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 font-mono font-bold ${slaColor}`}>
                        {isResolved ? '✓' : `${daysOpen}d`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConcernDetailDrawer 
        isOpen={!!selectedConcern} 
        concern={selectedConcern}
        currentUser={user}
        onClose={() => {
          setSelectedConcern(null);
          fetchConcerns(); // Refresh list after close in case status updated
        }} 
      />
    </div>
  );
}
