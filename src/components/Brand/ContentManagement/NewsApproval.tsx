import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface NewsAssignment {
  id: string;
  news_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'mandatory';
  assigned_at: string;
  news_item: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featured_image: string;
    is_mandatory: boolean;
    published_at: string;
  };
}

export function NewsApproval() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<NewsAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'mandatory'>('all');

  useEffect(() => {
    loadAssignments();
  }, [user]);

  const loadAssignments = async () => {
    if (!user?.brand_id) return;

    try {
      const { data, error } = await supabase
        .from('news_brand_assignments')
        .select(`
          id,
          news_id,
          status,
          assigned_at,
          news_items!inner (
            id,
            title,
            slug,
            excerpt,
            featured_image,
            is_mandatory,
            published_at
          )
        `)
        .eq('brand_id', user.brand_id)
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map(item => ({
        id: item.id,
        news_id: item.news_id,
        status: item.status,
        assigned_at: item.assigned_at,
        news_item: Array.isArray(item.news_items) ? item.news_items[0] : item.news_items
      }));

      setAssignments(formatted);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (assignmentId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('news_brand_assignments')
        .update({
          status: newStatus,
          responded_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;
      loadAssignments();
    } catch (error) {
      console.error('Error updating assignment:', error);
      alert('Failed to update assignment');
    }
  };

  const openInBuilder = (newsId: string) => {
    const builderUrl = import.meta.env.VITE_BUILDER_URL || 'https://windsurfer.builder';
    const jwtToken = localStorage.getItem('builder_jwt');
    window.open(`${builderUrl}?jwt=${jwtToken}&content_type=news&content_id=${newsId}&mode=preview`, '_blank');
  };

  const filteredAssignments = assignments.filter(a =>
    filter === 'all' || a.status === filter
  );

  const pendingCount = assignments.filter(a => a.status === 'pending').length;

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">News Approval</h1>
        <p className="text-gray-600">
          Review and approve news items shared by admin
        </p>
      </div>

      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-900">
            You have {pendingCount} pending news item{pendingCount !== 1 ? 's' : ''} waiting for your response
          </span>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({assignments.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'pending' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending ({assignments.filter(a => a.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('accepted')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'accepted' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Accepted ({assignments.filter(a => a.status === 'accepted').length})
        </button>
        <button
          onClick={() => setFilter('mandatory')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'mandatory' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Mandatory ({assignments.filter(a => a.status === 'mandatory').length})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'rejected' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Rejected ({assignments.filter(a => a.status === 'rejected').length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            {assignment.news_item.featured_image && (
              <img
                src={assignment.news_item.featured_image}
                alt={assignment.news_item.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{assignment.news_item.title}</h3>
                {assignment.news_item.is_mandatory && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                    Mandatory
                  </span>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {assignment.news_item.excerpt}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  assignment.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  assignment.status === 'mandatory' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {assignment.status}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openInBuilder(assignment.news_item.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>

                {assignment.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleResponse(assignment.id, 'accepted')}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      title="Accept"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleResponse(assignment.id, 'rejected')}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      title="Reject"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}

                {assignment.status === 'mandatory' && (
                  <div className="flex-1 text-center py-2 text-sm text-gray-500">
                    Required on website
                  </div>
                )}

                {(assignment.status === 'accepted' || assignment.status === 'rejected') && (
                  <button
                    onClick={() => handleResponse(assignment.id, assignment.status === 'accepted' ? 'rejected' : 'accepted')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Change to {assignment.status === 'accepted' ? 'Rejected' : 'Accepted'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAssignments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No news items to display
        </div>
      )}
    </div>
  );
}
