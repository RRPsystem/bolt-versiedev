import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { RoadmapItem, RoadmapVote } from '../../types/database';
import {
  Lightbulb,
  Wrench,
  Bug,
  Plug,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  Plus,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  FileCheck,
  Eye
} from 'lucide-react';

const categoryConfig = {
  feature: { icon: Lightbulb, label: 'Feature', color: 'bg-blue-100 text-blue-700' },
  improvement: { icon: Wrench, label: 'Improvement', color: 'bg-green-100 text-green-700' },
  bug_fix: { icon: Bug, label: 'Bug Fix', color: 'bg-red-100 text-red-700' },
  integration: { icon: Plug, label: 'Integration', color: 'bg-purple-100 text-purple-700' }
};

const statusConfig = {
  submitted: { icon: Clock, label: 'Submitted', color: 'text-gray-500' },
  under_review: { icon: Eye, label: 'Under Review', color: 'text-blue-500' },
  planned: { icon: AlertCircle, label: 'Planned', color: 'text-yellow-500' },
  in_progress: { icon: Play, label: 'In Progress', color: 'text-orange-500' },
  testing: { icon: FileCheck, label: 'Testing', color: 'text-indigo-500' },
  completed: { icon: CheckCircle2, label: 'Completed', color: 'text-green-500' },
  rejected: { icon: XCircle, label: 'Rejected', color: 'text-red-500' }
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-200 text-gray-700', indicator: '⚪' },
  medium: { label: 'Medium', color: 'bg-blue-200 text-blue-700', indicator: '🔵' },
  high: { label: 'High', color: 'bg-yellow-200 text-yellow-700', indicator: '🟡' },
  critical: { label: 'Critical', color: 'bg-red-200 text-red-700', indicator: '��' }
};

export default function RoadmapBoard() {
  const { user } = useAuth();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'votes' | 'date'>('votes');

  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: 'feature' as RoadmapItem['category']
  });

  useEffect(() => {
    loadRoadmapData();
  }, [user]);

  const loadRoadmapData = async () => {
    if (!user) return;

    try {
      const [itemsResult, votesResult] = await Promise.all([
        supabase
          .from('roadmap_items')
          .select('*')
          .order('vote_count', { ascending: false }),
        supabase
          .from('roadmap_votes')
          .select('roadmap_item_id')
          .eq('user_id', user.id)
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (votesResult.error) throw votesResult.error;

      setItems(itemsResult.data || []);
      setUserVotes(new Set(votesResult.data?.map(v => v.roadmap_item_id) || []));
    } catch (error) {
      console.error('Error loading roadmap:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (itemId: string) => {
    if (!user) return;

    try {
      const hasVoted = userVotes.has(itemId);

      if (hasVoted) {
        const { error } = await supabase
          .from('roadmap_votes')
          .delete()
          .eq('roadmap_item_id', itemId)
          .eq('user_id', user.id);

        if (error) throw error;

        setUserVotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      } else {
        const { error } = await supabase
          .from('roadmap_votes')
          .insert({ roadmap_item_id: itemId, user_id: user.id });

        if (error) throw error;

        setUserVotes(prev => new Set(prev).add(itemId));
      }

      await loadRoadmapData();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newItem.title.trim()) return;

    try {
      const { error } = await supabase
        .from('roadmap_items')
        .insert({
          title: newItem.title,
          description: newItem.description,
          category: newItem.category,
          created_by: user.id,
          brand_id: user.brand_id
        });

      if (error) throw error;

      setNewItem({ title: '', description: '', category: 'feature' });
      setShowNewForm(false);
      await loadRoadmapData();
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const toggleExpand = (itemId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const filteredItems = items
    .filter(item => filterStatus === 'all' || item.status === filterStatus)
    .filter(item => filterCategory === 'all' || item.category === filterCategory)
    .sort((a, b) => {
      if (sortBy === 'votes') {
        return b.vote_count - a.vote_count;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading roadmap...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Request Feature
        </button>
      </div>

      {showNewForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Request New Feature</h3>
          <form onSubmit={handleCreateItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the feature"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value as RoadmapItem['category'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="feature">Feature</option>
                <option value="improvement">Improvement</option>
                <option value="bug_fix">Bug Fix</option>
                <option value="integration">Integration</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Detailed description of what you need..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit Request
              </button>
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="testing">Testing</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="feature">Features</option>
            <option value="improvement">Improvements</option>
            <option value="bug_fix">Bug Fixes</option>
            <option value="integration">Integrations</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'votes' | 'date')}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="votes">Sort by Votes</option>
            <option value="date">Sort by Date</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const CategoryIcon = categoryConfig[item.category].icon;
                const StatusIcon = statusConfig[item.status].icon;
                const isExpanded = expandedRows.has(item.id);
                const hasVoted = userVotes.has(item.id);

                return (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="text-left font-medium text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {item.title}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${categoryConfig[item.category].color}`}>
                          <CategoryIcon className="w-3.5 h-3.5" />
                          {categoryConfig[item.category].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${statusConfig[item.status].color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusConfig[item.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">
                          {priorityConfig[item.priority].indicator} {priorityConfig[item.priority].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleVote(item.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                            hasVoted
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span className="font-medium">{item.vote_count}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 bg-gray-50">
                          <div className="space-y-3">
                            {item.description && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-1">Description</h4>
                                <p className="text-sm text-gray-600">{item.description}</p>
                              </div>
                            )}
                            {item.estimated_release && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-1">Estimated Release</h4>
                                <p className="text-sm text-gray-600">
                                  {new Date(item.estimated_release).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                            {item.operator_notes && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-1">Updates from Team</h4>
                                <p className="text-sm text-gray-600">{item.operator_notes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No items found. Be the first to request a feature!
          </div>
        )}
      </div>
    </div>
  );
}