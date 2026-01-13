import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import { 
  Home, Bot, Map, MapPin, Wallet, Calendar, 
  User, LogOut, ChevronDown, Settings, UserCircle 
} from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // 用于点击菜单外部自动关闭 (可选优化)
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setShowDropdown(false);
    navigate('/');
  };

  // ... navItems 保持不变 ...
  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/ai-assistant', icon: Bot, label: 'AI助手' },
    { path: '/map-planning', icon: Map, label: '路线规划' },
    { path: '/attractions', icon: MapPin, label: '景区推荐' },
    { path: '/budget', icon: Wallet, label: '预算管理' },
    { path: '/trips', icon: Calendar, label: '我的行程' },
  ];

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-800">智能旅游助手</Link>
        
        {/* 中间导航 ... */}
        <div className="hidden md:flex space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* 右侧用户区域 */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className={`flex items-center space-x-2 p-1 pr-2 rounded-full transition-all border ${
                  showDropdown ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-transparent'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 overflow-hidden">
                  {/* 如果有头像显示头像，没有显示图标 */}
                  {user?.avatar ? (
                    <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 max-w-[80px] truncate">
                  {user?.nickname || user?.username || '用户'}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* 下拉菜单 UI 升级 */}
              {showDropdown && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 z-50">
                  
                  {/* 用户信息概览 */}
                  <div className="px-5 py-3 border-b border-gray-50">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {user?.nickname || user?.username}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>

                  {/* 菜单项 */}
                  <div className="py-2">
                    <Link 
                      to="/profile" 
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                    >
                      <UserCircle className="h-4 w-4 mr-3 text-gray-400" />
                      个人中心
                    </Link>
                    
                    {/* 你可以在这里加更多选项，比如设置 */}
                    {/* <Link to="/settings" ... > <Settings ... /> 系统设置 </Link> */}
                    
                    <div className="my-1 border-t border-gray-50"></div>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/auth" className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors">登录</Link>
              <Link to="/auth?mode=register" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5">注册</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;