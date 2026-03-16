import { useState, useEffect } from 'react'
import { useConcerns } from '../hooks/useConcerns'
import type { Concern, ConcernCategory } from '../hooks/useConcerns'

interface StudentConcernHistoryProps {
  email: string
}

const statusColors: Record<string, string> = {
  Submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Routed: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Read: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Screened: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Resolved: 'bg-green-500/10 text-green-400 border-green-500/20',
  Escalated: 'bg-red-500/10 text-red-400 border-red-500/20'
}

export default function StudentConcernHistory({ email }: StudentConcernHistoryProps) {
  const { fetchMyConcerns, loading } = useConcerns()
  const [history, setHistory] = useState<Concern[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ConcernCategory | 'All'>('All')

  useEffect(() => {
    const loadHistory = async () => {
      const data = await fetchMyConcerns(email)
      setHistory(data)
    }
    loadHistory()
  }, [email])

  const filteredConcerns = history.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                         c.concern_number.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 font-bold">
            📋
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Concern History</h3>
            <p className="text-xs text-gray-500 mt-1">Track and manage your submitted concerns.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or code..."
              className="bg-[#0f1117] border border-[#2a2d3a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500 transition-all w-full sm:w-64"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
          >
            <option value="All">All Categories</option>
            <option value="Academic">Academic</option>
            <option value="Financial">Financial</option>
            <option value="Welfare">Welfare</option>
          </select>
        </div>
      </div>

      {loading && history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 text-sm">Loading your concern history...</p>
        </div>
      ) : filteredConcerns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[#2a2d3a] rounded-2xl">
          <span className="text-4xl mb-4">📤</span>
          <p className="text-gray-400 font-medium">No concerns found</p>
          <p className="text-gray-600 text-xs mt-1">
            {search || selectedCategory !== 'All' 
              ? 'Try adjusting your search or filters' 
              : 'You haven\'t submitted any concerns yet'}
          </p>
        </div>
      ) : (
        <div className="max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredConcerns.map((concern) => (
              <div 
                key={concern.id}
                className="bg-[#0f1117] border border-[#2a2d3a] hover:border-indigo-500/50 rounded-xl p-5 transition-all group overflow-hidden relative"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded">
                    {concern.concern_number}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColors[concern.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                    {concern.status}
                  </span>
                </div>
                
                <h4 className="text-white font-bold text-sm mb-2 group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {concern.title}
                </h4>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-600">📂</span>
                    <span className="text-[11px] text-gray-400 font-medium">{concern.category}</span>
                  </div>
                  {concern.sub_category && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-600">🏷️</span>
                      <span className="text-[11px] text-gray-400 font-medium truncate max-w-[120px]">{concern.sub_category}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[10px] text-gray-600">
                      {new Date(concern.submitted_at).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Decorative gradient corner */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent -mr-12 -mt-12 rounded-full group-hover:from-indigo-500/10 transition-colors"></div>
              </div>
            ))}
          </div>

          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #2a2d3a;
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #3f4451;
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
