import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RoadmapItem, User } from '../../types/database';
import {
  Lightbulb,
  Wrench,
  Bug,
  Plug,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Edit2,
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
  critical: { label: 'Critical', color: 'bg-red-200 text-red-700', indicator: '🔴' }
};

export default function RoadmapManagement() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [operators, setOperators] = useState<User[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [editForm, setEditForm] = useState<Partial<RoadmapItem>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsResult, operatorsResult] = await Promise.all([
        supabase
          .from('roadmap_items')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('users')
          .select('*')
          .eq('role', 'operator')
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (operatorsResult.error) throw operatorsResult.error;

      setItems(itemsResult.data || []);
      setOperators(operatorsResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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

  const startEdit = (item: RoadmapItem) => {
    setEditingItem(item.id);
    setEditForm({
      status: item.status,
      priority: item.priority,
      assigned_to: item.assigned_to || undefined,
      estimated_release: item.estimated_release || undefined,
      operator_notes: item.operator_notes || ''
    });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({});
  };

  const saveEdit = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('roadmap_items')
        .update(editForm)
        .eq('id', itemId);

      if (error) throw error;

      setEditingItem(null);
      setEditForm({});
      await loadData();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading roadmap...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Items</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{items.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">In Progress</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {items.filter(i => i.status === 'in_progress').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {items.filter(i => i.status === 'completed').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Votes</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {items.reduce((sum, item) => sum + item.vote_count, 0)}
          </div>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => {
                const CategoryIcon = categoryConfig[item.category].icon;
                const StatusIcon = statusConfig[item.status].icon;
                const isExpanded = expandedRows.has(item.id);
                const isEditing = editingItem === item.id;

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
                        {isEditing ? (
                          <select
                            value={editForm.status || item.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as RoadmapItem['status'] })}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="submitted">Submitted</option>
                            <option value="under_review">Under Review</option>
                            <option value="planned">Planned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="testing">Testing</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${statusConfig[item.status].color}`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusConfig[item.status].label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={editForm.priority || item.priority}
                            onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as RoadmapItem['priority'] })}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        ) : (
                          <span className="text-sm">
                            {priorityConfig[item.priority].indicator} {priorityConfig[item.priority].label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <ThumbsUp className="w-4 h-4" />
                          <span className="font-medium">{item.vote_count}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(item.id)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 bg-gray-50">
                          <div className="space-y-4">
                            {item.description && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-1">Description</h4>
                                <p className="text-sm text-gray-600">{item.description}</p>
                              </div>
                            )}

                            {isEditing ? (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Assign To
                                  </label>
                                  <select
                                    value={editForm.assigned_to || ''}
                                    onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value || undefined })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  >
                                    <option value="">Unassigned</option>
                                    {operators.map(op => (
                                      <option key={op.id} value={op.id}>{op.email}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Estimated Release
                                  </label>
                                  <input
                                    type="date"
                                    value={editForm.estimated_release || ''}
                                    onChange={(e) => setEditForm({ ...editForm, estimated_release: e.target.value || undefined })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Operator Notes
                                  </label>
                                  <textarea
                                    value={editForm.operator_notes || ''}
                                    onChange={(e) => setEditForm({ ...editForm, operator_notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    rows={3}
                                    placeholder="Add updates or notes for users..."
                                  />
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="font-semibold text-gray-700">Assigned To:</span>{' '}
                                    <span className="text-gray-600">
                                      {item.assigned_to
                                        ? operators.find(o => o.id === item.assigned_to)?.email || 'Unknown'
                                        : 'Unassigned'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-700">Created:</span>{' '}
                                    <span className="text-gray-600">
                                      {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-700">Est. Release:</span>{' '}
                                    <span className="text-gray-600">
                                      {item.estimated_release
                                        ? new Date(item.estimated_release).toLocaleDateString()
                                        : 'Not set'}
                                    </span>
                                  </div>
                                </div>
                                {item.operator_notes && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Updates from Team</h4>
                                    <p className="text-sm text-gray-600">{item.operator_notes}</p>
                                  </div>
                                )}
                              </>
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

        {items.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No roadmap items yet.
          </div>
        )}
      </div>
    </div>
  );
}