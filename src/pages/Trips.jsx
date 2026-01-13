import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // 确保引入 useNavigate
import { 
  Calendar, Plus, MapPin, Users, Edit2, Trash2, 
  Star, TrendingUp, Wallet, Plane, CheckCircle2, 
  AlertCircle, X, Loader2, Image as ImageIcon, Sparkles,
  Search, ChevronLeft, ChevronRight
} from 'lucide-react';

// 1. [修复] 引入 setCurrentTripId
import { fetchTrips, createTrip, updateTrip, deleteTrip, fetchTripStats, setCurrentTripId } from '../store/slices/tripSlice';
import Layout from '../components/Layout';
import ConfirmModal from '@/components/ConfirmModal';


const Trips = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { trips, stats, loading } = useSelector((state) => state.trips);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [isConfirmModalOpen,setIsConfirmModalOpen] = useState(false);
  const [currentDeleteId,setCurrentDeleteId] = useState(null);


  const [errors, setErrors] = useState({});

  // === 列表管理状态 ===
  const [searchTerm, setSearchTerm] = useState(''); // 搜索词
  const [currentPage, setCurrentPage] = useState(1); // 当前页码
  const itemsPerPage = 8; // 每页显示个数 (留一个位置给"新建"卡片，凑9宫格)

  // 初始表单状态
  const initialFormState = {
    title: '',
    destination: '',
    start_date: '',
    end_date: '',
    budget: '',
    participants: 1,
    image: '',
    highlights: '',
    rating: 0 
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    dispatch(fetchTrips());
    dispatch(fetchTripStats());
  }, [dispatch]);

  // === 过滤与分页逻辑 ===
  
  // 1. 过滤
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => 
      trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [trips, searchTerm]);

  // 2. 分页计算
  const totalPages = Math.ceil((filteredTrips.length + 1) / itemsPerPage); // +1 是因为有个"新建"卡片占位
  
  // 获取当前页的数据
  const currentTrips = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTrips.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredTrips]);

  // 搜索时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);


  const statusConfig = {
    completed: { label: '已完成', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    upcoming: { label: '即将出发', color: 'bg-blue-100 text-blue-700', icon: Plane },
    planning: { label: '计划中', color: 'bg-purple-100 text-purple-700', icon: Calendar },
    cancelled: { label: '已取消', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData(initialFormState);
    setErrors({});
    setShowModal(true);
  };

  // 跳转到预算页
  const handleGoToBudget = (e, tripId) => {
    e.stopPropagation(); 
    dispatch(setCurrentTripId(tripId)); 
    navigate('/budget');
  };

  const handleEditClick = (trip) => {
    setIsEditing(true);
    setEditId(trip.id);
    setErrors({});
    setFormData({
      title: trip.title,
      destination: trip.destination,
      start_date: trip.start_date ? trip.start_date.split('T')[0] : '',
      end_date: trip.end_date ? trip.end_date.split('T')[0] : '',
      budget: trip.budget,
      participants: trip.participants,
      image: trip.image || '',
      highlights: trip.highlights ? trip.highlights.join(', ') : '',
      rating: trip.rating || 0 
    });
    setShowModal(true);
  };

   // [新增] 表单校验逻辑
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '行程名称不能为空';
    }
    
    if (!formData.destination.trim()) {
      newErrors.destination = '目的地不能为空';
    }
    
    if (!formData.start_date) {
      newErrors.start_date = '请选择开始日期';
    }
    
    if (!formData.end_date) {
      newErrors.end_date = '请选择结束日期';
    }
    
    // 日期逻辑校验
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = '结束日期不能早于开始日期';
    }

    if (formData.participants < 1) {
      newErrors.participants = '人数至少为 1';
    }

    if (formData.budget < 0) {
      newErrors.budget = '预算不能为负数';
    }

    setErrors(newErrors);
    // 如果没有错误键，返回 true
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // 1. 先校验
    if (!validateForm()) {
      return; 
    }

    setSubmitting(true);
    
    const highlightsArray = formData.highlights
      ? formData.highlights.split(/[,，]/).map(s => s.trim()).filter(s => s)
      : [];

    const payload = {
      title: formData.title,
      destination: formData.destination,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      budget: parseFloat(formData.budget) || 0,
      participants: parseInt(formData.participants) || 1,
      image: formData.image || null,
      highlights: highlightsArray,
      rating: formData.rating > 0 ? parseInt(formData.rating) : null 
    };

    let result;
    if (isEditing) {
      result = await dispatch(updateTrip({ id: editId, data: payload }));
    } else {
      result = await dispatch(createTrip(payload));
    }
    
    setSubmitting(false);
    
    if (createTrip.fulfilled.match(result) || updateTrip.fulfilled.match(result)) {
      setShowModal(false);
      setFormData(initialFormState);
    } else {
      // 这里的 alert 可以换成更优雅的 Toast 提示
      alert('操作失败: ' + (result.payload || '未知错误'));
    }
  };


  const handleDeleteTrip = async (id) => {
    // if (window.confirm('确定要删除这个行程吗？相关的预算记录也会被删除。')) {
    //   await dispatch(deleteTrip(id));
    // }
    setIsConfirmModalOpen(true); 
    setCurrentDeleteId(id); 
  };

  const executeDeleteTrip = async () => {
    await dispatch(deleteTrip(currentDeleteId));
    setIsConfirmModalOpen(false);
    setCurrentDeleteId(null);
    setEditId(null);
    setIsEditing(false);
    setShowModal(false);
  };

  return (
    <Layout>
      <div className="min-h-screen pb-20 bg-gray-50/50">
        
        {/* Header & Stats Section */}
        <div className="bg-white rounded-3xl p-8 mb-10 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">我的行程库</h1>
              <p className="text-gray-500">记录每一次出发，珍藏每一份回忆</p>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              {/* 搜索框 */}
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="搜索行程..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>
              
              <button
                onClick={openAddModal}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all font-medium whitespace-nowrap"
              >
                <Plus className="h-5 w-5 md:mr-2" />
                <span className="hidden md:inline">创建行程</span>
              </button>
            </div>
          </div>

          {/* Stats Grid (保持不变) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Plane className="h-5 w-5" /></div>
                <span className="text-sm text-gray-500">总行程</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats?.total_trips || 0} <span className="text-sm font-normal text-gray-400">次</span></div>
            </div>
            <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg text-green-600"><CheckCircle2 className="h-5 w-5" /></div>
                <span className="text-sm text-gray-500">已完成</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats?.completed_trips || 0} <span className="text-sm font-normal text-gray-400">次</span></div>
            </div>
            <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Wallet className="h-5 w-5" /></div>
                <span className="text-sm text-gray-500">总投入</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">¥{stats?.total_spent ? (stats.total_spent / 10000).toFixed(2) : 0} <span className="text-sm font-normal text-gray-400">万</span></div>
            </div>
            <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><TrendingUp className="h-5 w-5" /></div>
                <span className="text-sm text-gray-500">足迹点</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats?.cities_visited || 0} <span className="text-sm font-normal text-gray-400">城</span></div>
            </div>
          </div>
        </div>

        {/* Trip Cards Grid */}
        {loading && trips.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentTrips.map((trip) => {
                 const StatusIcon = statusConfig[trip.status]?.icon || CheckCircle2;
                 const budget = trip.budget || 1; 
                 const progress = Math.min((trip.spent / budget) * 100, 100);
                 
                 return (
                  <div key={trip.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 flex flex-col">
                    {/* Image Area */}
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img
                        src={trip.image}
                        alt={trip.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold flex items-center backdrop-blur-md ${statusConfig[trip.status]?.color || 'bg-gray-100 text-gray-700'} bg-opacity-90`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[trip.status]?.label || trip.status}
                      </div>
                      
                      <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditClick(trip)} className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteTrip(trip.id)} className="p-2 bg-white/20 hover:bg-red-500/80 backdrop-blur-md rounded-full text-white transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {trip.rating && (
                        <div className="absolute bottom-4 left-4 flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < trip.rating ? 'fill-current' : 'text-white/30'}`} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{trip.title}</h3>
                      </div>
                      
                      <div className="flex items-center text-gray-500 text-sm mb-4">
                        <MapPin className="h-4 w-4 mr-1 text-blue-500" />
                        {trip.destination}
                        <span className="mx-2 text-gray-300">|</span>
                        <Calendar className="h-4 w-4 mr-1 text-blue-500" />
                        {trip.start_date ? new Date(trip.start_date).toLocaleDateString() : '待定'}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {trip.highlights && trip.highlights.length > 0 ? (
                          trip.highlights.slice(0, 3).map((tag, i) => ( // 限制显示标签数量防止撑开
                            <span key={i} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100">{tag}</span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">暂无亮点记录</span>
                        )}
                      </div>

                      <div className="flex gap-3 mt-auto mb-4">
                        <button 
                          onClick={(e) => handleGoToBudget(e, trip.id)}
                          className="flex-1 flex items-center justify-center py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          <Wallet className="w-4 h-4 mr-1.5" />
                          预算管理
                        </button>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-end mb-2">
                          <div className="flex items-center text-gray-500 text-sm"><Users className="h-4 w-4 mr-1.5" />{trip.participants} 人行</div>
                          <div className="text-right">
                            <span className="text-xs text-gray-400 block">预算执行</span>
                            <span className="text-sm font-bold text-gray-900">¥{trip.spent}</span>
                            <span className="text-xs text-gray-400"> / {trip.budget}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${progress > 90 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* 新增卡片 - 仅在最后一页显示，或者一直显示在列表末尾 */}
              {/* 这里我们将它作为最后一个格子 */}
              <button
                onClick={openAddModal}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/30 transition-all min-h-[400px]"
              >
                <div className="p-4 bg-gray-50 rounded-full mb-4 group-hover:bg-blue-100 transition-colors"><Plus className="h-8 w-8" /></div>
                <span className="font-medium">创建新的旅行计划</span>
              </button>
            </div>

            {/* 分页控制器 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-12 space-x-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                
                <span className="text-sm text-gray-600 font-medium px-4">
                  第 {currentPage} 页 / 共 {totalPages} 页
                </span>

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Form (Add/Edit) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
          
          <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">{isEditing ? '编辑行程' : '开启一段新旅程'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              {/* Title & Destination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">行程名称</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="给这次旅行起个好听的名字" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                {errors.title && <p className="text-red-500 text-xs mt-1 ml-1">{errors.title}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">目的地</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <input type="text" value={formData.destination} onChange={(e) => setFormData({...formData, destination: e.target.value})} placeholder="去哪里？" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                     {errors.destination && <p className="text-red-500 text-xs mt-1 ml-1">{errors.destination}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">人数</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <input type="number" min="1" value={formData.participants} onChange={(e) => setFormData({...formData, participants: e.target.value})} placeholder="1" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                     {errors.participants && <p className="text-red-500 text-xs mt-1 ml-1">{errors.participants}</p>}
                  
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">开始日期</label>
                  <input type="date" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-600" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                  {errors.start_date && <p className="text-red-500 text-xs mt-1 ml-1">{errors.start_date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">结束日期</label>
                  <input type="date" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-600" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                  {errors.end_date && <p className="text-red-500 text-xs mt-1 ml-1">{errors.end_date}</p>}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1.5">预算 (¥)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-gray-400">¥</span>
                  <input 
                    disabled={isEditing} // 只有编辑模式可能想禁用修改预算？或者始终允许修改。这里使用了不可用样式演示
                    type="number" 
                    value={formData.budget} 
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    placeholder="0.00" 
                    className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                  />
                  {errors.budget && <p className="text-red-500 text-xs mt-1 ml-1">{errors.budget}</p>}
                
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">封面图片 URL</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input type="text" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} placeholder="https://..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <p className="text-xs text-gray-400 mt-1 ml-1">留空则使用默认随机图</p>
              </div>

              {/* Highlights */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">行程亮点 (用逗号分隔)</label>
                <div className="relative">
                  <Sparkles className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <textarea rows="2" value={formData.highlights} onChange={(e) => setFormData({...formData, highlights: e.target.value})} placeholder="例如：迪士尼烟花, 外滩夜景" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">评分 / 期待值</label>
                <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="focus:outline-none transform hover:scale-110 transition-transform"
                    >
                      <Star 
                        className={`h-6 w-6 transition-colors ${
                          formData.rating >= star 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-gray-300 hover:text-yellow-200"
                        }`} 
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-400">
                    {formData.rating > 0 ? `${formData.rating} 星` : '未评分'}
                  </span>
                </div>
              </div>

            </div>

            <div className="p-6 pt-2 flex gap-4 bg-white border-t border-gray-50">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">取消</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-70">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin"/> : (isEditing ? '保存修改' : '创建行程')}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false)
          setCurrentDeleteId(null);
        }}
        onConfirm={executeDeleteTrip}
        title="确认删除"
        description="确定要删除这个行程吗？相关的预算记录也会被删除。"
        confirmText="删除"
        cancelText="取消"
      />
    </Layout>
  );
};

export default Trips;