import React, { useState } from 'react';
import { 
  Users, 
  Activity, 
  Clock, 
  MessageSquare, 
  TrendingUp,
  Filter,
  Search,
  Download,
  Eye,
  Bot,
  Globe
} from 'lucide-react';

interface UserSession {
  id: string;
  user: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  startTime: string;
  duration: string;
  actions: number;
  lastActivity: string;
  status: 'active' | 'idle' | 'offline';
  location: string;
  device: string;
}

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: string;
  type: 'chat' | 'api' | 'system' | 'auth';
}

export function UserActivity() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'logs'>('sessions');
  const [timeFilter, setTimeFilter] = useState('24h');

  const userSessions: UserSession[] = [
    {
      id: '1',
      user: { name: 'Sarah Johnson', email: 'sarah@travelclub.com', role: 'Brand Manager' },
      startTime: '2 hours ago',
      duration: '1h 45m',
      actions: 23,
      lastActivity: '5 minutes ago',
      status: 'active',
      location: 'Amsterdam, NL',
      device: 'Chrome on macOS'
    },
    {
      id: '2',
      user: { name: 'Mike Chen', email: 'mike@admin.com', role: 'Administrator' },
      startTime: '4 hours ago',
      duration: '3h 12m',
      actions: 67,
      lastActivity: '12 minutes ago',
      status: 'idle',
      location: 'New York, US',
      device: 'Firefox on Windows'
    },
    {
      id: '3',
      user: { name: 'Emma Wilson', email: 'emma@adventures.com', role: 'Brand User' },
      startTime: '1 hour ago',
      duration: '45m',
      actions: 15,
      lastActivity: '2 minutes ago',
      status: 'active',
      location: 'London, UK',
      device: 'Safari on iOS'
    }
  ];

  const activityLogs: ActivityLog[] = [
    {
      id: '1',
      user: 'Sarah Johnson',
      action: 'Generated destination content',
      details: 'Created content for "Barcelona Travel Guide"',
      timestamp: '2 minutes ago',
      type: 'chat'
    },
    {
      id: '2',
      user: 'Mike Chen',
      action: 'Updated GPT model',
      details: 'Modified "Travel Destination Expert" system prompt',
      timestamp: '15 minutes ago',
      type: 'system'
    },
    {
      id: '3',
      user: 'Emma Wilson',
      action: 'API call made',
      details: 'OpenAI GPT-3.5 - Route planning request',
      timestamp: '18 minutes ago',
      type: 'api'
    },
    {
      id: '4',
      user: 'Sarah Johnson',
      action: 'User login',
      details: 'Successful authentication from Amsterdam',
      timestamp: '2 hours ago',
      type: 'auth'
    },
    {
      id: '5',
      user: 'David Park',
      action: 'Generated image',
      details: 'DALL-E image generation: "Sunset over Santorini"',
      timestamp: '3 hours ago',
      type: 'chat'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'idle':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'api':
        return <Bot className="w-4 h-4 text-green-600" />;
      case 'system':
        return <Activity className="w-4 h-4 text-purple-600" />;
      case 'auth':
        return <Users className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Activity</h2>
          <p className="text-gray-600">Monitor user sessions and system activity</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={16} />
            <span>Filter</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">23</p>
              <div className="flex items-center space-x-1 mt-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">+12%</span>
              </div>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">156</p>
              <div className="flex items-center space-x-1 mt-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">+8%</span>
              </div>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Session Time</p>
              <p className="text-2xl font-bold text-gray-900">2h 15m</p>
              <div className="flex items-center space-x-1 mt-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">+5%</span>
              </div>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Actions</p>
              <p className="text-2xl font-bold text-gray-900">1,247</p>
              <div className="flex items-center space-x-1 mt-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">+23%</span>
              </div>
            </div>
            <MessageSquare className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Active Sessions
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Activity Logs
            </button>
          </nav>
        </div>

        {/* Active Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Active User Sessions</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {session.user.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{session.user.name}</div>
                            <div className="text-sm text-gray-500">{session.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusDot(session.status)}`}></div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                            {session.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>Started: {session.startTime}</div>
                        <div className="text-gray-500">Duration: {session.duration}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{session.actions} actions</div>
                        <div className="text-gray-500">Last: {session.lastActivity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Globe size={14} />
                          <span>{session.location}</span>
                        </div>
                        <div className="text-xs text-gray-400">{session.device}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-blue-600 hover:text-blue-900 flex items-center space-x-1">
                          <Eye size={14} />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity Logs Tab */}
        {activeTab === 'logs' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">System Activity Logs</h3>
              <div className="flex items-center space-x-3">
                <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">All Activities</option>
                  <option value="chat">Chat Activities</option>
                  <option value="api">API Calls</option>
                  <option value="system">System Changes</option>
                  <option value="auth">Authentication</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {log.user} • {log.action}
                      </p>
                      <p className="text-sm text-gray-500">{log.timestamp}</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        log.type === 'chat' ? 'bg-blue-100 text-blue-800' :
                        log.type === 'api' ? 'bg-green-100 text-green-800' :
                        log.type === 'system' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {log.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Load More Activities
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}