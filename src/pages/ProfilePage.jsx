import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  User, Mail, Phone, Lock, Save, Loader2, 
  CheckCircle2, AlertCircle, Shield, CreditCard, 
  Bell, ChevronRight, Camera, LayoutGrid 
} from 'lucide-react';
import { updateUserProfile } from '@/store/slices/authSlice';
import { authService } from '@/services/authService';
import Layout from '@/components/Layout';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  
  // 标签页状态
  const [activeTab, setActiveTab] = useState('profile');
  const [message, setMessage] = useState({ type: '', text: '' });

  // 表单数据
  const [profileData, setProfileData] = useState({
    nickname: '',
    phone: '',
    avatar: '',
    username: '', 
    email: '',    
    status: '',   
    created_at: '' 
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  // 初始化数据
  useEffect(() => {
    if (user) {
      setProfileData({
        nickname: user.nickname || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        username: user.username || '',
        email: user.email || '',
        status: user.status || 'active',
        created_at: user.created_at || ''
      });
    }
  }, [user]);

  // 消息自动清除
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // 处理资料更新
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.nickname || profileData.nickname.trim().length < 1) {
      setMessage({ type: 'error', text: '昵称不能为空' });
      return;
    }

    const payload = {
      nickname: profileData.nickname,
      phone: profileData.phone || null,
      avatar: profileData.avatar || null
    };

    const result = await dispatch(updateUserProfile(payload));

    if (updateUserProfile.fulfilled.match(result)) {
      setMessage({ type: 'success', text: '已保存更改' });
    } else {
      setMessage({ type: 'error', text: result.payload || '保存失败' });
    }
  };

  // 处理密码更新
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password.length < 6) {
      setMessage({ type: 'error', text: '新密码长度至少需要6位' });
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: '两次密码输入不一致' });
      return;
    }

    try {
      await authService.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      });
      setMessage({ type: 'success', text: '密码修改成功' });
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || '修改失败' });
    }
  };

  // 侧边栏菜单配置
  const menuItems = [
    { id: 'profile', label: '基本资料', icon: User, desc: '管理您的个人信息' },
    { id: 'security', label: '登录与安全', icon: Shield, desc: '密码修改与账户保护' },
    // 仅作展示的占位菜单，体现完整性
    { id: 'notifications', label: '通知设置', icon: Bell, desc: '管理邮件订阅', disabled: true },
    { id: 'billing', label: '会员订阅', icon: CreditCard, desc: '查看您的订阅计划', disabled: true },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          
          {/* 页面标题区 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">账户设置</h1>
            <p className="text-gray-500 mt-2">管理您的个人资料、账户安全及偏好设置。</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* 左侧导航栏 */}
            <nav className="lg:w-72 flex-shrink-0">
              <div className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => !item.disabled && setActiveTab(item.id)}
                      disabled={item.disabled}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                          : item.disabled
                            ? 'text-gray-400 cursor-not-allowed opacity-60'
                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div className="text-left">
                        <div className={isActive ? 'font-semibold' : ''}>{item.label}</div>
                      </div>
                      {isActive && <ChevronRight className="ml-auto h-4 w-4 text-blue-500" />}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* 右侧内容区 */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                
                {/* 顶部反馈消息 */}
                {message.text && (
                  <div className={`px-6 py-3 flex items-center text-sm font-medium border-b ${
                    message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'
                  }`}>
                    {message.type === 'error' ? <AlertCircle className="w-4 h-4 mr-2"/> : <CheckCircle2 className="w-4 h-4 mr-2"/>}
                    {message.text}
                  </div>
                )}

                {/* --- 基本资料 --- */}
                {activeTab === 'profile' && (
                  <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-8 pb-6 border-b border-gray-100">
                      <h2 className="text-xl font-bold text-gray-900">个人信息</h2>
                      <p className="text-sm text-gray-500 mt-1">更新您的头像和个人详细信息。</p>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-8">
                      {/* 头像设置区 - 横向布局 */}
                      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                        <div className="relative group shrink-0">
                          <div className="w-24 h-24 rounded-full border-2 border-gray-100 overflow-hidden bg-gray-50">
                            <img 
                              src={profileData.avatar || `https://ui-avatars.com/api/?name=${profileData.username}&background=eff6ff&color=2563eb`} 
                              alt="Avatar" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="flex-1 w-full space-y-3">
                          <label className="text-sm font-medium text-gray-700">头像链接</label>
                          <div className="flex gap-3">
                            <div className="relative flex-1">
                              <Camera className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                              <input
                                type="text"
                                value={profileData.avatar}
                                onChange={(e) => setProfileData({...profileData, avatar: e.target.value})}
                                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="输入图片 URL"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">建议使用正方形图片，支持 JPG、PNG 格式。</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700">昵称</label>
                          <input
                            type="text"
                            required
                            value={profileData.nickname}
                            onChange={(e) => setProfileData({...profileData, nickname: e.target.value})}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700">用户名</label>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              @
                            </span>
                            <input
                              type="text"
                              disabled
                              value={profileData.username}
                              className="flex-1 w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-r-lg text-sm text-gray-500 cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700">绑定邮箱</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                              type="email"
                              disabled
                              value={profileData.email}
                              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700">手机号码</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                              type="tel"
                              value={profileData.phone}
                              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              placeholder="未设置"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 flex items-center justify-end border-t border-gray-100">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex items-center px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-70 transition-all"
                        >
                          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                          保存更改
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* --- 安全设置 --- */}
                {activeTab === 'security' && (
                  <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-8 pb-6 border-b border-gray-100">
                      <h2 className="text-xl font-bold text-gray-900">密码与安全</h2>
                      <p className="text-sm text-gray-500 mt-1">管理您的密码以保护账户安全。</p>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="max-w-xl space-y-6">
                      
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">当前密码</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <input
                            type="password"
                            required
                            value={passwordData.old_password}
                            onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="输入当前密码以验证"
                          />
                        </div>
                      </div>

                      <hr className="border-gray-100 my-6" />

                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700">新密码</label>
                          <input
                            type="password"
                            required
                            value={passwordData.new_password}
                            onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="至少6位字符"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700">确认新密码</label>
                          <input
                            type="password"
                            required
                            value={passwordData.confirm_password}
                            onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="再次输入新密码"
                          />
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4 mt-4">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">密码要求</h4>
                        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                          <li>长度至少 6 个字符</li>
                          <li>建议包含字母、数字和特殊符号</li>
                          <li>不要使用曾在其他网站使用过的密码</li>
                        </ul>
                      </div>

                      <div className="pt-6 flex items-center justify-end">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex items-center px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-all"
                        >
                          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Shield className="w-4 h-4 mr-2"/>}
                          更新密码
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;