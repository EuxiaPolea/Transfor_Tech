import React, { useState, useEffect } from 'react';
import { CloudArrowUpIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useConcerns } from '../hooks/useConcerns';
import type { ConcernCategory } from '../hooks/useConcerns';
import type { CurrentUser } from '../hooks/useAuth';

interface SubmitConcernFormProps {
  user: CurrentUser;
}

export default function SubmitConcernForm({ user }: SubmitConcernFormProps) {
  const { submitConcern, loading, error: submitError } = useConcerns();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ConcernCategory | ''>('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [email, setEmail] = useState(user.email);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('concerntrack_draft');
    if (savedDraft) {
      setShowDraftBanner(true);
    }
  }, []);

  // Success message auto-hide
  useEffect(() => {
    if (successId) {
      const timer = setTimeout(() => setSuccessId(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [successId]);

  const handleRestoreDraft = () => {
    const savedDraft = localStorage.getItem('concerntrack_draft');
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      setTitle(draft.title || '');
      setDescription(draft.description || '');
      setCategory(draft.category || '');
      setIsAnonymous(draft.isAnonymous || false);
      setEmail(draft.email || user.email);
      setFileUrl(draft.fileUrl || null);
    }
    setShowDraftBanner(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('concerntrack_draft');
    setShowDraftBanner(false);
  };

  const handleSaveDraft = () => {
    const draft = { title, description, category, isAnonymous, email, fileUrl };
    localStorage.setItem('concerntrack_draft', JSON.stringify(draft));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!category) newErrors.category = "Please select a category";
    if (title.length < 5) newErrors.title = "Please enter a brief title (min 5 chars)";
    if (description.length < 20) newErrors.description = "Please describe your concern in detail (min 20 characters)";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) newErrors.email = "Please enter a valid email address";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const concernNumber = await submitConcern({
        title,
        description,
        category: category as ConcernCategory,
        isAnonymous,
        studentId: user.id,
        studentName: user.fullName,
        studentNumber: user.studentId || 'N/A',
        program: user.program || 'N/A',
        email,
        fileUrl: fileUrl || undefined
      });

      setSuccessId(concernNumber);
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setIsAnonymous(false);
      setEmail(user.email);
      setFileUrl(null);
      localStorage.removeItem('concerntrack_draft');
    } catch (err) {
      console.error('Submission failed:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl shadow-2xl p-8">
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Submit a concern</h2>
          <p className="text-[#9ca3af]">Your concern will be routed to the correct department automatically.</p>
        </div>

        {showDraftBanner && (
          <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <p className="text-indigo-300 text-sm font-medium">You have a saved draft. Would you like to restore it?</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleRestoreDraft} className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">Restore</button>
              <button onClick={handleDiscardDraft} className="text-xs px-3 py-1.5 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors">Discard</button>
            </div>
          </div>
        )}

        {successId && (
          <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start space-x-3">
            <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-400 font-medium">Your concern has been submitted successfully!</p>
              <p className="text-green-400/80 text-sm mt-1">Reference ID: <span className="font-bold">{successId}</span>. You can track your concern status using this ID in the Status Tracker tab.</p>
            </div>
          </div>
        )}

        {submitError && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{submitError}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!isAnonymous && (
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1">Full name</label>
                <input 
                  type="text" 
                  value={user.fullName}
                  readOnly
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2.5 text-white opacity-60 cursor-not-allowed"
                />
              </div>
            )}
            <div className={isAnonymous ? "md:col-span-2" : ""}>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1">Student ID</label>
              <input 
                type="text" 
                value={user.studentId || 'N/A'}
                readOnly
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2.5 text-white opacity-60 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1">Program & year</label>
              <input 
                type="text" 
                value={user.program || 'N/A'}
                readOnly
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2.5 text-white opacity-60 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1">Email address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="For notifications"
                className={`w-full bg-[#0f1117] border ${errors.email ? 'border-red-500' : 'border-[#2a2d3a]'} rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value as ConcernCategory)}
                className={`w-full bg-[#0f1117] border ${errors.category ? 'border-red-500' : 'border-[#2a2d3a]'} rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors appearance-none`}
              >
                <option value="" disabled>Select category...</option>
                <option value="Academic">Academic</option>
                <option value="Financial">Financial</option>
                <option value="Welfare">Welfare / Facilities</option>
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1">Concern title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary"
                className={`w-full bg-[#0f1117] border ${errors.title ? 'border-red-500' : 'border-[#2a2d3a]'} rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors`}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1">Detailed description</label>
            <textarea 
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your concern in detail..."
              className={`w-full bg-[#0f1117] border ${errors.description ? 'border-red-500' : 'border-[#2a2d3a]'} rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-y`}
            ></textarea>
            <div className="flex justify-between mt-1">
              {errors.description ? <p className="text-red-500 text-xs">{errors.description}</p> : <div />}
              <span className={`text-xs font-medium ${description.length > 490 ? 'text-red-400' : 'text-[#9ca3af]'}`}>
                {description.length} / 500
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1">Attachments (optional)</label>
            <div className="w-full md:w-2/3 border-2 border-dashed border-[#2a2d3a] rounded-xl px-4 py-8 flex flex-col items-center justify-center bg-[#0f1117]/50 hover:bg-[#0f1117] transition-colors cursor-not-allowed group">
              <CloudArrowUpIcon className="w-8 h-8 text-[#4b5563] group-hover:text-indigo-400 mb-2 transition-colors" />
              <span className="text-sm text-[#4b5563] font-medium italic">Upload coming soon</span>
            </div>
          </div>

          <div className="flex items-start space-x-3 pt-4 border-t border-[#2a2d3a]">
            <div className="flex items-center h-5 mt-0.5">
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`w-11 h-6 rounded-full relative transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#1a1d27] ${
                  isAnonymous ? 'bg-indigo-600' : 'bg-gray-600'
                }`}
              >
                <div 
                  className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
                    isAnonymous ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="text-sm">
              <label 
                onClick={() => setIsAnonymous(!isAnonymous)} 
                className="font-medium text-white select-none cursor-pointer inline-block"
              >
                Submit anonymously
              </label>
              <p className="text-[#9ca3af] mt-0.5 leading-relaxed">Your name is hidden from department staff. Admin retains a sealed record for audit purposes only.</p>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <div className="flex items-center">
              {draftSaved && <span className="text-green-400 text-sm font-medium mr-4">Draft saved!</span>}
              <button 
                type="button"
                onClick={handleSaveDraft}
                className="px-6 py-2.5 border border-[#4b5563] text-white rounded-lg hover:bg-[#2a2d3a] font-medium transition-colors"
                disabled={loading}
              >
                Save draft
              </button>
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20 flex items-center"
            >
              {loading ? 'Submitting...' : 'Submit concern'} 
              {!loading && <span className="ml-2">→</span>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
