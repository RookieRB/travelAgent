import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Wallet, Plus, Edit2, Trash2, TrendingUp, TrendingDown, 
  PieChart as PieChartIcon, AlertCircle, Sparkles, X, Loader2,
  Car, Home, Coffee, Ticket, ShoppingBag, Landmark, ChevronDown,
  Banknote, Calendar, PlusCircle, ArrowRight, Search,Check,MapPin,
  FileText, // [修复] 之前漏掉了这个引入
  ListChecks // 新增一个图标用于列表头
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend 
} from 'recharts';
import Layout from '../components/Layout';

// Actions
import { 
  fetchBudgetSummary, createBudgetItem, deleteBudgetItem, updateBudgetItem, 
  addExpense, fetchExpenses, updateExpense, deleteExpense, 
  fetchBudgetItemExpenses, clearItemExpenses 
} from '../store/slices/budgetSlice';
import { fetchTrips, setCurrentTripId } from '@/store/slices/tripSlice';
import ConfirmModal from '@/components/ConfirmModal';



const ICON_MAP = {
  Car: Car, Home: Home, Coffee: Coffee, Ticket: Ticket, ShoppingBag: ShoppingBag, Wallet: Wallet, Landmark: Landmark
};

const Budget = () => {
  const dispatch = useDispatch();
  const { trips, currentTripId } = useSelector((state) => state.trips);
  const { summary, expenses, itemExpenses, loading } = useSelector((state) => state.budget); 

  // === 状态管理 ===
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryEditId, setCategoryEditId] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ category: '', amount: '', category_type: 'other' });

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseEditId, setExpenseEditId] = useState(null);
  const [expenseForm, setExpenseForm] = useState({ 
    budget_item_id: '', amount: '', note: '', expense_date: new Date().toISOString().split('T')[0] 
  });
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBudgetItem, setSelectedBudgetItem] = useState(null); 

  // === ✅ 新增：统一的确认弹窗状态 ===
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    type: null, // 'budget' (预算分类) 或 'expense' (支出记录)
    id: null,   // 要删除的 ID
    title: '',  // 弹窗标题
    desc: ''    // 弹窗描述
  });

  

  // === D. 行程切换状态 ===
  const [showTripModal, setShowTripModal] = useState(false);
  const [tripSearchTerm, setTripSearchTerm] = useState('');

  // 处理切换行程
  const handleSwitchTrip = (tripId) => {
    dispatch(setCurrentTripId(tripId));
    setShowTripModal(false);
    setTripSearchTerm(''); // 重置搜索
  };

  // 过滤行程列表
  const filteredTrips = trips.filter(t => 
    t.title.toLowerCase().includes(tripSearchTerm.toLowerCase()) || 
    (t.destination && t.destination.toLowerCase().includes(tripSearchTerm.toLowerCase()))
  );


  // === 初始化 ===
  useEffect(() => {
    if (trips.length === 0) dispatch(fetchTrips());
  }, [dispatch, trips.length]);

  useEffect(() => {
    if (currentTripId) {
      dispatch(fetchBudgetSummary(currentTripId));
      dispatch(fetchExpenses(currentTripId)); // 获取总支出列表
    }
  }, [dispatch, currentTripId]);

  const handleTripChange = (e) => dispatch(setCurrentTripId(e.target.value));
  const formatCurrency = (val) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(val || 0);
  
  const mapTypeToIcon = (type) => {
    switch(type) {
      case 'transport': return 'Car'; case 'accommodation': return 'Home'; case 'food': return 'Coffee';
      case 'tickets': return 'Ticket'; case 'shopping': return 'ShoppingBag'; default: return 'Wallet';
    }
  };

  // === A. 预算分类操作 ===
  const openCategoryModal = (item = null, e = null) => {
    if (e) e.stopPropagation(); 
    if (item) {
      setCategoryEditId(item.id);
      setCategoryForm({ category: item.category, amount: item.amount, category_type: item.category_type || 'other' });
    } else {
      setCategoryEditId(null);
      setCategoryForm({ category: '', amount: '', category_type: 'other' });
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (categoryForm.category && categoryForm.amount) {
      const payload = {
        category: categoryForm.category,
        amount: parseFloat(categoryForm.amount),
        category_type: categoryForm.category_type,
        color: '#6366f1',
        icon: mapTypeToIcon(categoryForm.category_type)
      };
      if (categoryEditId) {
        await dispatch(updateBudgetItem({ tripId: currentTripId, itemId: categoryEditId, data: payload }));
      } else {
        await dispatch(createBudgetItem({ tripId: currentTripId, data: payload }));
      }
      setShowCategoryModal(false);
    }
  };

  // const handleDeleteBudget = async (itemId, e) => {
  //   e.stopPropagation();
  //   if (window.confirm('删除分类将同时删除该分类下的所有支出记录，确定继续吗？')) {
  //     await dispatch(deleteBudgetItem({ tripId: currentTripId, itemId }));
  //   }
  // };

  // 打开删除“预算分类”的弹窗
  const openDeleteBudgetModal = (itemId, e) => {
    if (e) e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      type: 'budget',
      id: itemId,
      title: '删除预算分类',
      desc: '删除此分类将同时永久删除该分类下的所有支出记录，且无法恢复。确定要继续吗？'
    });
  };

  



  // === B. 记账操作 (新增 & 编辑) ===
  const openExpenseModal = (budgetItem = null, expenseToEdit = null, e = null) => {
    if (e) e.stopPropagation();
    
    // 尝试确定当前属于哪个分类：
    // 1. 传入的 budgetItem
    // 2. 如果是编辑，根据 expenseToEdit.budget_item_id 找到对应的 item (从 summary.items 中找)
    // 3. 之前选中的 selectedBudgetItem
    let targetItem = budgetItem || selectedBudgetItem;

    if (!targetItem && expenseToEdit && summary?.items) {
      targetItem = summary.items.find(i => i.id === expenseToEdit.budget_item_id);
    }

    setSelectedBudgetItem(targetItem); 
    
    if (expenseToEdit) {
      setExpenseEditId(expenseToEdit.id);
      setExpenseForm({
        budget_item_id: expenseToEdit.budget_item_id, // 允许编辑时保持原ID
        amount: expenseToEdit.amount,
        note: expenseToEdit.note || '',
        expense_date: expenseToEdit.expense_date
      });
    } else {
      setExpenseEditId(null);
      setExpenseForm({
        budget_item_id: targetItem ? targetItem.id : '', // 如果没有预选分类，则为空
        amount: '',
        note: '',
        expense_date: new Date().toISOString().split('T')[0]
      });
    }
    setShowExpenseModal(true);
  };

  const handleSaveExpense = async () => {
    if (expenseForm.amount && expenseForm.budget_item_id) {
      const payload = {
        budget_item_id: expenseForm.budget_item_id,
        amount: parseFloat(expenseForm.amount),
        note: expenseForm.note,
        expense_date: expenseForm.expense_date
      };

      if (expenseEditId) {
        await dispatch(updateExpense({
          tripId: currentTripId,
          expenseId: expenseEditId,
          data: payload,
          budgetItemId: selectedBudgetItem?.id 
        }));
      } else {
        await dispatch(addExpense({
          tripId: currentTripId,
          data: payload
        }));
        if (showDetailModal && selectedBudgetItem) {
           dispatch(fetchBudgetItemExpenses({ tripId: currentTripId, budgetItemId: selectedBudgetItem.id }));
        }
      }
      setShowExpenseModal(false);
    }
  };

  // 打开删除“支出记录”的弹窗
  const openDeleteExpenseModal = (expenseId, e) => {
    if (e) e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      type: 'expense',
      id: expenseId,
      title: '删除支出记录',
      desc: '确定要删除这条支出记录吗？删除后金额将退回预算。'
    });
  };


  const handleExecuteConfirm = async () => {
    const { type, id } = confirmConfig;

    if (type === 'budget') {
      // 执行删除预算
      await dispatch(deleteBudgetItem({ tripId: currentTripId, itemId: id }));
    } else if (type === 'expense') {
      // 执行删除支出
      await dispatch(deleteExpense({ 
        tripId: currentTripId, 
        expenseId: id, 
        // 注意：如果是在详情页删除，需要传 budgetItemId 以便刷新详情列表
        budgetItemId: selectedBudgetItem?.id 
      }));
    }

    // 关闭弹窗并重置状态
    setConfirmConfig({ isOpen: false, type: null, id: null, title: '', desc: '' });
  };

  // 关闭弹窗辅助函数
  const handleCloseConfirm = () => {
    setConfirmConfig({ ...confirmConfig, isOpen: false });
  };


  // === C. 查看详情操作 ===
  const openDetailModal = async (item) => {
    setSelectedBudgetItem(item);
    console.log(item);
    await dispatch(fetchBudgetItemExpenses({ tripId: currentTripId, budgetItemId: item.id }));
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    dispatch(clearItemExpenses());
  };

  // 数据准备
  const items = summary?.items || [];
  const pieData = items.filter(i => parseFloat(i.spent) > 0).map(i => ({ name: i.category, value: parseFloat(i.spent) }));
  const COLORS = items.map(i => i.color || '#ccc');
  const currentTrip = trips.find(t => t.id === currentTripId);

  // 辅助查找分类名称（用于总支出列表显示分类）
  const getCategoryName = (id) => {
    const item = items.find(i => i.id === id);
    return item ? item.category : '未知分类';
  };

  if (trips.length === 0 && !loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <Wallet className="h-12 w-12 text-gray-300 mb-4"/>
          <h2 className="text-xl font-bold text-gray-700">暂无行程</h2>
          <a href="/trips" className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">去创建行程</a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pb-20 bg-gray-50/50">
        
        {/* 顶部栏 */}
        <div className=" backdrop-blur-md sticky top-0 z-30 transition-all">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            
            {/* 左侧：行程切换按钮 - 极简悬浮风格 */}
            <div className="flex items-center">
              <button 
                onClick={() => setShowTripModal(true)}
                className="group flex items-center gap-3 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-900 rounded-2xl px-4 py-2.5 transition-all shadow-sm hover:shadow-md outline-none active:scale-[0.98]"
              >
                {/* 左侧图标装饰 */}
                <div className="bg-blue-50 text-blue-600 p-2 rounded-xl group-hover:bg-blue-100 transition-colors">
                  <MapPin className="h-4 w-4" />
                </div>

                <div className="flex flex-col items-start text-left mr-2">
                  <span className="font-bold text-sm text-gray-900 leading-none mb-1">
                    {currentTrip ? currentTrip.title : '选择行程'}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                     {currentTrip ? (currentTrip.destination || '目的地未定') : '开启新旅程'}
                  </span>
                </div>
                
                <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </button>
            </div>

            {/* 右侧区域 (保持不变) */}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {loading && !summary ? (
            <div className="flex justify-center pt-20"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>
          ) : (
            <>
              {/* 1. 头部统计卡片 */}
              <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">预算与支出</h1>
                    <p className="text-gray-500 text-sm">记一笔，让旅行更从容</p>
                  </div>
                  <button onClick={() => openCategoryModal()} className="flex items-center px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 text-sm font-medium">
                    <Plus className="h-4 w-4 mr-2" /> 新建预算分类
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* ... 统计卡片内容保持不变 ... */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-4 right-4 opacity-10"><Wallet className="h-16 w-16" /></div>
                    <p className="text-sm text-gray-500 mb-1">总预算</p>
                    <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(summary?.total_budget)}</h3>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-4 right-4 opacity-10"><TrendingDown className="h-16 w-16 text-blue-600" /></div>
                    <p className="text-sm text-gray-500 mb-1">已支出</p>
                    <h3 className="text-3xl font-bold text-blue-600">{formatCurrency(summary?.total_spent)}</h3>
                    <div className="mt-2 text-xs text-gray-400">占预算 {summary?.spent_percentage}%</div>
                  </div>
                  <div className={`rounded-2xl p-6 border relative overflow-hidden text-white ${summary?.remaining < 0 ? 'bg-red-500 border-red-600' : 'bg-green-500 border-green-600'}`}>
                    <div className="absolute top-4 right-4 opacity-20"><Sparkles className="h-16 w-16" /></div>
                    <p className="text-sm text-white/80 mb-1">剩余可用</p>
                    <h3 className="text-3xl font-bold">{formatCurrency(summary?.remaining)}</h3>
                    <div className="mt-2 text-xs text-white/80 bg-white/20 px-2 py-1 rounded w-fit">
                      {summary?.remaining < 0 ? '已超支' : '资金充足'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. 图表与分类列表 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* 左侧：图表 */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[350px]">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 w-full flex items-center"><PieChartIcon className="h-5 w-5 mr-2 text-gray-400"/> 支出构成</h3>
                    {pieData.length > 0 ? (
                      <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                              {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                            </Pie>
                            <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">暂无支出数据</div>
                    )}
                  </div>
                </div>

                {/* 右侧：列表 */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* AI 洞察 */}
                  {(summary?.insights?.length > 0 || summary?.warnings?.length > 0) && (
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-sm text-indigo-800 space-y-2">
                      <h4 className="font-bold flex items-center"><Sparkles className="h-4 w-4 mr-2"/> 智能分析</h4>
                      {summary.warnings.map((w, i) => <p key={i} className="text-red-600 flex items-center"><AlertCircle className="h-3 w-3 mr-1"/>{w}</p>)}
                      {summary.insights.map((m, i) => <p key={i}>{m}</p>)}
                    </div>
                  )}

                  {/* 预算分类列表 */}
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between">
                      <h3 className="font-bold text-gray-900">预算分类</h3>
                      <span className="text-xs text-gray-400">点击卡片查看明细</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {items.map((item) => {
                        const Icon = ICON_MAP[item.icon] || Wallet;
                        const percent = item.amount > 0 ? Math.min((item.spent / item.amount) * 100, 100) : 0;
                        const isOver = item.spent > item.amount;

                        return (
                          <div 
                            key={item.id} 
                            onClick={() => openDetailModal(item)} 
                            className="group p-5 hover:bg-gray-50 transition-all relative cursor-pointer"
                          >
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-gray-100 text-gray-600" style={{ color: item.color }}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900 flex items-center">
                                    {item.category}
                                    <ArrowRight className="h-3 w-3 ml-2 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"/>
                                  </div>
                                  <div className="text-xs text-gray-400 mt-0.5">预算 {formatCurrency(item.amount)}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-bold ${isOver ? 'text-red-500' : 'text-gray-900'}`}>{formatCurrency(item.spent)}</div>
                                {isOver && <div className="text-xs text-red-500">超支 {formatCurrency(item.spent - item.amount)}</div>}
                              </div>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                              <div className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : ''}`} style={{ width: `${percent}%`, backgroundColor: isOver ? undefined : item.color }}></div>
                            </div>
                            <div className="flex justify-end space-x-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => openExpenseModal(item, null, e)} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg flex items-center hover:bg-blue-700 shadow-sm">
                                <PlusCircle className="h-3 w-3 mr-1" /> 记一笔
                              </button>
                              <button onClick={(e) => openCategoryModal(item, e)} className="p-1.5 text-gray-400 hover:text-blue-600 bg-white border border-gray-200 rounded-lg"><Edit2 className="h-3 w-3" /></button>
                              <button onClick={(e) => openDeleteBudgetModal(item.id, e)} className="p-1.5 text-gray-400 hover:text-red-600 bg-white border border-gray-200 rounded-lg"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* [新增] 3. 底部：全部支出记录明细 */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 flex items-center">
                    <ListChecks className="h-5 w-5 mr-2 text-gray-500"/>
                    全部支出明细
                  </h3>
                  <span className="text-xs text-gray-400">共 {expenses.length} 笔</span>
                </div>
                
                {expenses && expenses.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {expenses.map((exp) => (
                      <div key={exp.id} className="p-5 flex justify-between items-center hover:bg-gray-50 group">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-gray-100 rounded-full text-gray-500">
                            <Banknote className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 text-base">{exp.note || '未备注支出'}</div>
                            <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                              <span className="flex items-center"><Calendar className="h-3 w-3 mr-1"/> {exp.expense_date}</span>
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{getCategoryName(exp.budget_item_id)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-gray-900 text-lg">- {formatCurrency(exp.amount)}</span>
                          
                          {/* 全局列表的编辑/删除 */}
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => openExpenseModal(null, exp)} // 注意这里 budgetItem 传 null，函数内会自动处理
                              className="p-1.5 bg-white border rounded-lg hover:text-blue-600 shadow-sm"
                            >
                              <Edit2 className="h-4 w-4"/>
                            </button>
                            <button 
                              onClick={() => openDeleteExpenseModal(exp.id)} 
                              className="p-1.5 bg-white border rounded-lg hover:text-red-600 shadow-sm"
                            >
                              <Trash2 className="h-4 w-4"/>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center text-gray-400">
                    <FileText className="h-12 w-12 mb-3 opacity-20" />
                    <p>暂无任何支出记录</p>
                  </div>
                )}
              </div>

            </>
          )}
        </div>
      </div>

      {/* --- 弹窗 1: 预算分类 (Add/Edit) --- */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">{categoryEditId ? '编辑分类' : '新建分类'}</h3>
              <button onClick={() => setShowCategoryModal(false)}><X className="h-5 w-5 text-gray-400"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">名称</label>
                <input value={categoryForm.category} onChange={e => setCategoryForm({...categoryForm, category: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50" placeholder="如: 纪念品" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">类型</label>
                <select value={categoryForm.category_type} onChange={e => setCategoryForm({...categoryForm, category_type: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50">
                  <option value="transport">交通</option><option value="accommodation">住宿</option><option value="food">餐饮</option>
                  <option value="tickets">门票</option><option value="shopping">购物</option><option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">预算金额</label>
                <input type="number" value={categoryForm.amount} onChange={e => setCategoryForm({...categoryForm, amount: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50" placeholder="0.00" />
              </div>
              <button onClick={handleSaveCategory} className="w-full bg-black text-white py-3 rounded-xl font-bold mt-2">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* --- 弹窗 2: 记一笔 (Add/Edit Expense) --- */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm" style={{ zIndex: 60 }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg flex items-center"><Banknote className="h-5 w-5 mr-2 text-blue-600"/> {expenseEditId ? '编辑支出' : '记一笔'}</h3>
              <button onClick={() => setShowExpenseModal(false)}><X className="h-5 w-5 text-gray-400"/></button>
            </div>
            
            {/* 只有新增模式或者明确有分类时才显示分类提示 */}
            <div className="space-y-4">
              {/* 如果是编辑模式，允许修改所属分类 */}
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">所属分类</label>
                <select 
                  value={expenseForm.budget_item_id} 
                  onChange={e => setExpenseForm({...expenseForm, budget_item_id: e.target.value})}
                  className="w-full border rounded-xl p-3 bg-gray-50"
                  disabled={!expenseEditId && selectedBudgetItem} // 如果是在分类卡片点击的新增，则锁定分类
                >
                  <option value="" disabled>请选择分类</option>
                  {items.map(i => (
                    <option key={i.id} value={i.id}>{i.category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">金额 (¥)</label>
                <input type="number" autoFocus value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full border-2 border-blue-100 focus:border-blue-500 rounded-xl p-3 text-xl font-bold text-blue-600 outline-none" placeholder="0.00" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">备注</label>
                <input value={expenseForm.note} onChange={e => setExpenseForm({...expenseForm, note: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50" placeholder="买了什么？" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">日期</label>
                <input type="date" value={expenseForm.expense_date} onChange={e => setExpenseForm({...expenseForm, expense_date: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50" />
              </div>
              <button onClick={handleSaveExpense} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold mt-2 shadow-lg shadow-blue-200 transition-all">
                {expenseEditId ? '保存修改' : '确认记账'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 弹窗 3: 详情弹窗 (Show Detail) --- */}
      {showDetailModal && selectedBudgetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={closeDetailModal}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedBudgetItem.category}</h3>
                <p className="text-xs text-gray-500 mt-0.5">支出明细</p>
              </div>
              <button onClick={closeDetailModal} className="bg-white p-1.5 rounded-full shadow-sm hover:bg-gray-100"><X className="h-5 w-5 text-gray-500"/></button>
            </div>

            <div className="p-0 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {itemExpenses && itemExpenses.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {itemExpenses.map(exp => (
                    <div key={exp.id} className="p-5 flex justify-between items-center hover:bg-gray-50 group">
                      <div>
                        <div className="font-bold text-gray-800 text-base">{exp.note || '未备注支出'}</div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center"><Calendar className="h-3 w-3 mr-1"/> {exp.expense_date}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-gray-900 text-lg">- {formatCurrency(exp.amount)}</span>
                        
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => openExpenseModal(selectedBudgetItem, exp, e)} 
                            className="p-1.5 bg-white border rounded-lg hover:text-blue-600 shadow-sm"
                          >
                            <Edit2 className="h-4 w-4"/>
                          </button>
                          <button 
                            onClick={() => handleDeleteExpense(exp.id)} 
                            className="p-1.5 bg-white border rounded-lg hover:text-red-600 shadow-sm"
                          >
                            <Trash2 className="h-4 w-4"/>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center text-gray-400">
                  <div className="p-4 bg-gray-50 rounded-full mb-3"><FileText className="h-8 w-8 opacity-30" /></div>
                  <p>暂无支出记录</p>
                  <button onClick={() => openExpenseModal(selectedBudgetItem)} className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100">记一笔</button>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-500">合计已支出</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(selectedBudgetItem.spent)}</span>
            </div>
          </div>
        </div>
      )}

      {/* --- 弹窗 4: 切换行程 (Switch Trip Modal) --- */}
      {showTripModal && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 sm:pt-32 p-4 bg-gray-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          {/* 点击背景关闭 */}
          <div className="absolute inset-0" onClick={() => setShowTripModal(false)}></div>
          
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative z-10 animate-in slide-in-from-bottom-4 duration-300 border border-gray-100">
            
            {/* 1. 头部 & 搜索 */}
            <div className="p-5 border-b border-gray-50 bg-white">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="font-bold text-xl text-gray-900">切换行程</h3>
                  <p className="text-xs text-gray-500 mt-1">选择您要管理的旅行计划</p>
                </div>
                <button 
                  onClick={() => setShowTripModal(false)} 
                  className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <X className="h-5 w-5"/>
                </button>
              </div>
              
              {/* 搜索框 - 更加圆润 */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="搜索行程..." 
                  value={tripSearchTerm}
                  onChange={(e) => setTripSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border-none text-sm rounded-2xl pl-11 pr-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* 2. 行程列表 - 优化滚动体验 */}
            {/* max-h-[50vh] 确保在手机上也不会溢出，overflow-y-auto 开启滚动 */}
            <div className="max-h-[50vh] overflow-y-auto p-3 bg-white space-y-2">
              {filteredTrips.length > 0 ? (
                filteredTrips.map((trip) => {
                  const isActive = trip.id === currentTripId;
                  return (
                    <button
                      key={trip.id}
                      onClick={() => handleSwitchTrip(trip.id)}
                      className={`
                        w-full text-left p-4 rounded-2xl flex items-center justify-between transition-all duration-200 group border
                        ${isActive 
                          ? 'bg-blue-50/60 border-blue-200 shadow-sm' 
                          : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'
                        }
                      `}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        {/* 标题 */}
                        <h4 className={`font-bold text-base truncate mb-1.5 ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                          {trip.title}
                        </h4>
                        
                        {/* 信息行：目的地 | 时间 */}
                        <div className="flex items-center text-xs text-gray-500 gap-3">
                          <div className="flex items-center gap-1 bg-gray-100/50 px-2 py-1 rounded-md truncate max-w-[120px]">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="truncate">{trip.destination || '未定'}</span>
                          </div>
                          {trip.start_date && (
                             <div className="flex items-center gap-1">
                               <Calendar className="h-3 w-3 text-gray-400" />
                               <span>{new Date(trip.start_date).toLocaleDateString()}</span>
                             </div>
                          )}
                        </div>
                      </div>

                      {/* 右侧状态图标 */}
                      <div className="shrink-0">
                        {isActive ? (
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 text-gray-400">
                             <ArrowRight className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                // 空状态
                <div className="py-16 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">没有找到相关行程</p>
                </div>
              )}
            </div>

            {/* 3. 底部操作 */}
            <div className="p-4 border-t border-gray-50 bg-gray-50/50 flex justify-center">
              <a 
                href="/trips/#/trips" 
                className="inline-flex items-center justify-center w-full py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                管理所有行程
              </a>
            </div>

          </div>
        </div>
      )}

      
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleExecuteConfirm}
        title={confirmConfig.title}
        description={confirmConfig.desc}
        confirmText="确定删除"
        cancelText="取消"
        danger={true} // 删除操作通常是红色的
      />
    </Layout>
  );
};

export default Budget;