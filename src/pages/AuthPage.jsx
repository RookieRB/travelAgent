import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, registerUser, clearError } from '../store/slices/authSlice';
import { Loader2, ArrowRight, Plane } from 'lucide-react';

const AuthPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  
  const { loading, error, isAuthenticated, successMessage } = useSelector((state) => state.auth);

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nickname: ''
  });

  // --- 逻辑部分保持不变 ---
  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [isLoginMode, dispatch]);

  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setIsLoginMode(false);
    }
  }, [searchParams]);

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormData({ username: '', email: '', password: '', nickname: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoginMode) {
      dispatch(loginUser({ username: formData.username, password: formData.password }));
    } else {
      const resultAction = await dispatch(registerUser(formData));
      if (registerUser.fulfilled.match(resultAction)) {
         setIsLoginMode(true);
         setFormData(prev => ({ ...prev, password: '' }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      
      {/* 背景装饰：极淡的网格纹理，增加精致感但干扰视觉 */}
      <div className="absolute inset-0 z-0 opacity-40" 
           style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Logo 区域 */}
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 transform rotate-3">
             <Plane className="h-7 w-7 text-white" />
          </div>
        </div>
        
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          {isLoginMode ? '欢迎回来' : '注册账户'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLoginMode ? '登录您的 AI 旅行规划师' : '开启您的智能化旅程'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[420px] relative z-10">
        <div className="bg-white py-10 px-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl border border-gray-100">
          
          {/* 错误/成功提示 */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center animate-fade-in">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
              {error}
            </div>
          )}
          {successMessage && !error && (
             <div className="mb-6 p-4 rounded-lg bg-green-50 text-green-600 text-sm font-medium border border-green-100 flex items-center animate-fade-in">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
              {successMessage}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* 用户名 */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1.5">
                用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200"
                placeholder="请输入用户名"
              />
            </div>

            {/* 邮箱 (仅注册) */}
            {!isLoginMode && (
              <div className="animate-fade-in-up">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  电子邮箱
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200"
                  placeholder="name@example.com"
                />
              </div>
            )}

            {/* 密码 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                 <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                   密码
                 </label>
                 {isLoginMode && (
                   <div className="text-sm">
                     <a href="#" className="font-medium text-blue-600 hover:text-blue-500">忘记密码?</a>
                   </div>
                 )}
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            {/* 按钮 */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-200 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <span className="flex items-center">
                    {isLoginMode ? '登录' : '创建账户'} 
                    <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* 底部切换 */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-400 text-xs">或者</span>
              </div>
            </div>

            <div className="mt-6 text-center">
               <span className="text-gray-600 text-sm">
                 {isLoginMode ? '还没有账号？' : '已经有账号了？'}
               </span>
               <button 
                 onClick={toggleMode}
                 className="ml-2 text-sm font-bold text-blue-600 hover:text-blue-500 transition-colors"
               >
                 {isLoginMode ? '注册新账号' : '登录账号'}
               </button>
            </div>
          </div>
        </div>
        
        {/* 版权信息 */}
        <p className="mt-8 text-center text-xs text-gray-400">
          © 2024 AI Travel Planner. All rights reserved.
        </p>

      </div>
    </div>
  );
};

export default AuthPage;