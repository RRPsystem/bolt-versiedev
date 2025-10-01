import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Users, 
  Bot,
  Calendar,
  Download,
  Filter
} from 'lucide-react';

interface UsageData {
  date: string;
  apiCalls: number;
  cost: number;
  users: number;
  avgResponseTime: number;
}

interface APIUsage {
  name: string;
  calls: number;
  cost: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export function UsageMonitoring() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('calls');

  const usageData: UsageData[] = [
    { date: '2024-01-01', apiCalls: 1247, cost: 24.50, users: 156, avgResponseTime: 1.2 },
    { date: '2024-01-02', apiCalls: 1356, cost: 27.12, users: 167, avgResponseTime: 1.1 },
    { date: '2024-01-03', apiCalls: 1189, cost: 23.78, users: 145, avgResponseTime: 1.3 },
    { date: '2024-01-04', apiCalls: 1423, cost: 28.46, users: 178, avgResponseTime: 1.0 },
    { date: '2024-01-05', apiCalls: 1567, cost: 31.34, users: 189, avgResponseTime: 1.2 },
    { date: '2024-01-06', apiCalls: 1334, cost: 26.68, users: 156, avgResponseTime: 1.1 },
    { date: '2024-01-07', apiCalls: 1445, cost: 28.90, users: 167, avgResponseTime: 1.3 }
  ];

  const apiUsage: APIUsage[] = [
    { name: 'OpenAI GPT-3.5', calls: 8456, cost: 169.12, percentage: 65, trend: 'up' },
    { name: 'OpenAI GPT-4', calls: 2134, cost: 85.36, percentage: 20, trend: 'down' },
    { name: 'OpenAI DALL-E', calls: 1567, cost: 47.01, percentage: 12, trend: 'up' },
    { name: 'Google Maps', calls: 389, cost: 11.67, percentage: 3, trend: 'stable' }
  ];

  const totalCalls = usageData.reduce((sum, day) => sum + day.apiCalls, 0);
  const totalCost = usageData.reduce((sum, day) => sum + day.cost, 0);
  const avgUsers = Math.round(usageData.reduce((sum, day) => sum + day.users, 0) / usageData.length);
  const avgResponseTime = (usageData.reduce((sum, day) => sum + day.avgResponseTime, 0) / usageData.length).toFixed(1);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Usage Monitoring</h2>
          <p className="text-gray-600">Track API usage, costs, and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total API Calls</p>
              <p className="text-2xl font-bold text-gray-900">{totalCalls.toLocaleString()}</p>
              <div className="flex items-center space-x-1 mt-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">+12.5%</span>
              </div>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900">Connect APIs</p>
              <div className="flex items-center space-x-1 mt-1">
                <span className="text-sm text-gray-500">Configure API keys first</span>
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{avgUsers}</p>
              <div className="flex items-center space-x-1 mt-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">+5.2%</span>
              </div>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">{avgResponseTime}s</p>
              <div className="flex items-center space-x-1 mt-1">
                <TrendingDown className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">-3.1%</span>
              </div>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Usage Chart */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Usage Trends</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedMetric('calls')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  selectedMetric === 'calls' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                API Calls
              </button>
              <button
                onClick={() => setSelectedMetric('cost')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  selectedMetric === 'cost' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cost
              </button>
              <button
                onClick={() => setSelectedMetric('users')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  selectedMetric === 'users' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Users
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Simple Bar Chart Visualization */}
          <div className="space-y-4">
            {usageData.map((day, index) => {
              const value = selectedMetric === 'calls' ? day.apiCalls : 
                           selectedMetric === 'cost' ? day.cost : day.users;
              const maxValue = Math.max(...usageData.map(d => 
                selectedMetric === 'calls' ? d.apiCalls : 
                selectedMetric === 'cost' ? d.cost : d.users
              ));
              const percentage = (value / maxValue) * 100;

              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-20 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-6 relative">
                      <div 
                        className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2" 
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-white text-xs font-medium">
                          {selectedMetric === 'cost' ? `$${value.toFixed(2)}` : value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* API Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">API Usage Breakdown</h3>
            <p className="text-sm text-gray-600 mt-1">Usage by API endpoint</p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {apiUsage.map((api, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bot className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{api.name}</div>
                      <div className="text-sm text-gray-500">
                        {api.calls.toLocaleString()} calls • ${api.cost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{api.percentage}%</div>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(api.trend)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Cost Analysis</h3>
            <p className="text-sm text-gray-600 mt-1">Cost breakdown and projections</p>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Current Month</span>
                <span className="text-sm font-medium text-gray-900">$312.45</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '62%' }}></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">62% of monthly budget ($500)</div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Projected Month End</span>
                <span className="text-sm font-medium text-gray-900">$485.20</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '97%' }}></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">97% of monthly budget</div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Cost Optimization Tips</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Configure your OpenAI API key in API Settings</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Monitor usage through the OpenAI dashboard</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Use GPT-3.5 for cost-effective content generation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}