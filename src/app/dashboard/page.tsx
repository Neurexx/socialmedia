/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { postAPI, userAPI } from '../../lib/api';
import { socketService } from '../../lib/socket';
import {toast} from "sonner"

interface Post {
  _id: string;
  title: string;
  description: string;
  author: { username: string };
  createdAt: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
}

export default function DashboardPage() {
  const { user, logout, isLoading} = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'create' | 'users'>('timeline');
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Create post form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {

    if(isLoading)
      return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Load initial data
    loadTimeline();
    loadUsers();

    // Connect to WebSocket with user ID
    console.log('Connecting to WebSocket with user ID:', user.id);
    const socket = socketService.connect(user.id);
    console.log(user)

    // Setup connection status
    socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setSocketConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setSocketConnected(false);
    });

    // Setup WebSocket notifications
    socketService.onNotification((data) => {
      
      toast(<div className='text-zinc-900 p-2 text-2xl'>{data.message}</div>)

      setNotifications(prev => [data.message, ...prev.slice(0, 9)]);
      
      // Reload timeline when new posts are created
      if (data.message.includes('created a new post')) {
        loadTimeline();
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      socketService.offNotification();
      socketService.disconnect();
      setSocketConnected(false);
    };
  }, [user, router, isLoading]);

  const loadTimeline = async () => {
    try {
      const response = await postAPI.getTimeline();
      setPosts(response.data);
      console.log('📰 Timeline loaded:', response.data.length, 'posts');
    } catch (err) {
      console.error('Failed to load timeline:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      setUsers(response.data);
      console.log('👥 Users loaded:', response.data.length, 'users');
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await postAPI.create(title, description);
      setTitle('');
      setDescription('');
      setSuccess('Post queued for creation! You\'ll be notified when it\'s published.');
      console.log('✅ Post creation request sent');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create post');
      console.error('❌ Post creation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUser = async (userId: string) => {
    try {
      await userAPI.followUser(userId);
      loadUsers(); // Refresh users list
      console.log('✅ Followed user:', userId);
    } catch (err: any) {
      console.error('Failed to follow user:', err);
    }
  };

  const handleUnfollowUser = async (userId: string) => {
    try {
      await userAPI.unfollowUser(userId);
      loadUsers(); // Refresh users list
      console.log('✅ Unfollowed user:', userId);
    } catch (err: any) {
      console.error('Failed to unfollow user:', err);
    }
  };

  const handleLogout = () => {
    socketService.disconnect();
    logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Social Media App</h1>
              {/* WebSocket Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {socketConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.username}!</span>
              
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow p-4">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`w-full text-left px-3 py-2 rounded ${
                      activeTab === 'timeline' ? 'bg-blue-100 text-blue-700' : ' text-zinc-900 hover:bg-gray-100'
                    }`}
                  >
                    Timeline
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('create')}
                    className={`w-full text-left px-3 py-2 rounded ${
                      activeTab === 'create' ? 'bg-blue-100 text-blue-700' : 'text-zinc-900 hover:bg-gray-100'
                    }`}
                  >
                    Create Post
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`w-full text-left px-3 py-2 rounded ${
                      activeTab === 'users' ? 'bg-blue-100 text-blue-700' : 'text-zinc-900 hover:bg-gray-100'
                    }`}
                  >
                    Discover Users
                  </button>
                </li>
              </ul>
            </nav>

            {/* Notifications
            <div className="mt-6 bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">Recent Notifications</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {notifications.length}
                </span>
              </div>
              {notifications.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  No notifications yet
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((notification, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-600 p-2 bg-blue-50 rounded border-l-2 border-blue-200"
                    >
                      {notification}
                    </div>
                  ))}
                </div>
              )}
            </div> */}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'timeline' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold">Your Timeline</h2>
                  <p className="text-gray-600">Posts from users you follow</p>
                </div>
                <div className="divide-y">
                  {posts.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No posts yet. Follow some users to see their posts here!
                    </div>
                  ) : (
                    posts.map((post) => (
                      <div key={post._id} className="p-6">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {post.author.username[0].toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-medium text-gray-900">
                                {post.author.username}
                              </h3>
                              <span className="text-sm text-gray-500">
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="mt-1 text-lg font-semibold text-gray-900">
                              {post.title}
                            </h4>
                            <p className="mt-1 text-gray-700">{post.description}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'create' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold">Create New Post</h2>
                  <p className="text-gray-600">Share something with your followers</p>
                </div>
                <form onSubmit={handleCreatePost} className="p-6">
                  {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                      {success}
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-zinc-900 focus:ring-blue-500"
                      placeholder="Enter post title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-zinc-900 focus:ring-blue-500"
                      placeholder="What's on your mind?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Creating Post...' : 'Create Post'}
                  </button>
                  <p className="mt-2 text-sm text-gray-500">
                    Note: Posts are processed with a 5-second delay. You&apos;ll receive a notification when published.
                  </p>
                </form>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold">Discover Users</h2>
                  <p className="text-gray-600">Find and follow other users</p>
                </div>
                <div className="divide-y">
                  {users.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No other users found.
                    </div>
                  ) : (
                    users.map((otherUser) => (
                      <div key={otherUser._id} className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {otherUser.username[0].toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {otherUser.username}
                              </h3>
                              <p className="text-sm text-gray-500">{otherUser.email}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleFollowUser(otherUser._id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                            >
                              Follow
                            </button>
                            <button
                              onClick={() => handleUnfollowUser(otherUser._id)}
                              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded text-sm"
                            >
                              Unfollow
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}