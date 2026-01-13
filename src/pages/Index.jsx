import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, 
  Map as MapIcon, 
  MapPin, 
  Wallet, 
  Calendar,
  ArrowRight,
  Sparkles,
  Ticket, // 替换 Visa 图标
  Star,
  Compass // 替换 Globe 图标
} from 'lucide-react';
import Layout from '../components/Layout';

const Index = () => {
  // 核心功能数据 - 调整为国内场景
  const features = [
    {
      icon: Bot,
      title: 'AI 深度定制',
      description: '基于您的兴趣图谱与旅行节奏，生成独一无二的专属方案。',
      link: '/ai-assistant',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      icon: MapIcon,
      title: '全域路线规划',
      description: '集成高德/百度实时数据，避拥堵，提供多种交通组合建议。',
      link: '/map-planning',
      gradient: 'from-emerald-400 to-teal-600',
    },
    {
      icon: MapPin,
      title: '小众秘境挖掘',
      description: 'AI 智能挖掘国内当地人私藏的宝藏景点，避开人山人海。',
      link: '/attractions',
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      icon: Wallet,
      title: '智能预算管家',
      description: '实时监控机票酒店价格波动，自动分配餐饮、住宿和娱乐预算。',
      link: '/budget',
      gradient: 'from-orange-400 to-red-500',
    },
    {
      icon: Calendar,
      title: '动态行程管理',
      description: '突发状况？AI 助手一键调整后续行程，无缝衔接。',
      link: '/trips',
      gradient: 'from-pink-500 to-rose-600',
    },
    {
      icon: Ticket, // 替换为门票/预约图标
      title: '全网门票预约',
      description: '聚合国内各大景区预约通道，智能抢票与入园提醒。',
      link: '/tickets',
      gradient: 'from-cyan-400 to-blue-500',
    }
  ];

  // 热门推荐数据 - 替换为国内热门
  const destinations = [
    { name: '敦煌·甘肃', tag: '丝路回响', img: 'https://th.bing.com/th/id/OIP.u4rEWxRBDIxsiQF5nXevugHaEK?w=283&h=180&c=7&r=0&o=7&pid=1.7&rm=3' },
    { name: '川西·四川', tag: '雪山草甸', img: 'https://th.bing.com/th/id/OIP.HqsrNLzVrchod7B0d81POwHaEK?w=285&h=180&c=7&r=0&o=7&pid=1.7&rm=3' },
    { name: '大理·云南', tag: '风花雪月', img: 'https://th.bing.com/th/id/OIP.URocNGfE0IMRzN3buDEKTwHaEo?w=287&h=180&c=7&r=0&o=7&pid=1.7&rm=3' }
  ];

  return (
    <Layout>
      <div className="font-sans bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
        
        {/* Hero Section: 极简大气风格 (保持不变) */}
        <div className="relative w-full h-[85vh] max-h-[800px] mb-20 overflow-hidden bg-white">
          <div className="absolute inset-0">
             <img 
               src="https://images.unsplash.com/photo-1500375592092-40eb2168fd21?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" // 换了一张更宽广的风景图
               alt="Hero Background"
               className="w-full h-full object-cover object-center animate-zoom-out"
             />
             <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-slate-50"></div>
          </div>
          
          <div className="relative h-full flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto pt-20">
            <div className="animate-fade-in-up inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/30 shadow-lg mb-8">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-white font-medium tracking-wide text-sm">AI POWERED TRAVEL AGENT</span>
            </div>

            <h1 className="animate-fade-in-up delay-100 text-5xl md:text-7xl font-bold text-white mb-8 leading-tight drop-shadow-lg tracking-tight">
              探索神州，<br/>
              定格<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-300">山河之美</span>
            </h1>

            <p className="animate-fade-in-up delay-200 text-lg md:text-xl text-gray-100 mb-12 max-w-2xl mx-auto leading-relaxed drop-shadow-md font-light">
              告别繁琐攻略。只需一个想法，AI 即可为您构建包含交通、住宿、景点的完美中国行。
            </p>

            <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-5 w-full justify-center">
              <Link 
                to="/ai-assistant" 
                className="group relative px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-xl overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  开始规划旅程 <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform"/>
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* 悬浮数据卡片 */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 -mt-32 mb-24">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {[
              { num: '300+', label: '覆盖国内城市', icon: Compass, color: 'text-blue-600', bg: 'bg-blue-50' },
              { num: '100w+', label: 'AI 生成行程', icon: Bot, color: 'text-purple-600', bg: 'bg-purple-50' },
              { num: '4.9/5', label: '用户好评率', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-center space-x-4 border-b md:border-b-0 md:border-r border-gray-100 last:border-0 pb-6 md:pb-0">
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="text-3xl font-bold text-gray-900 tracking-tight">{stat.num}</div>
                  <div className="text-gray-500 text-sm font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 主要内容容器 */}
        <div className="max-w-7xl mx-auto px-6">
          
          {/* 功能网格：保持之前的卡片风格，数据已更新 */}
          <div className="mb-32">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl font-bold text-gray-900 tracking-tight">懂旅行，更懂中国</h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-lg">从大漠孤烟到江南烟雨，我们提供全流程的智能化服务体验</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Link
                    key={index}
                    to={feature.link}
                    className="group relative bg-white rounded-3xl p-8 border border-gray-100 hover:border-blue-100 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-50 to-blue-50 rounded-bl-[100px] -mr-8 -mt-8 transition-all group-hover:scale-150 group-hover:opacity-100 opacity-50"></div>
                    
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${feature.gradient} text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors relative z-10">
                      {feature.title}
                    </h3>
                    <p className="text-gray-500 leading-relaxed mb-6 relative z-10 text-sm">
                      {feature.description}
                    </p>
                    
                    <div className="flex items-center text-sm font-bold text-gray-300 group-hover:text-blue-600 transition-colors">
                      <span className="mr-2">探索功能</span>
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* NEW: 交互式流程图 - 极简/微光/通透风格 */}
          <div className="relative mb-32 select-none ">
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent rounded-[3rem] -z-10"></div>
            
            <div className="px-8 py-16 md:p-20 border border-white/60 bg-white/40 backdrop-blur-sm rounded-[3rem] shadow-sm">
              <div className="text-center mb-16">
                <span className="text-blue-600 font-semibold tracking-wider text-sm uppercase mb-2 block">Workflow</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">AI 如何为您规划</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative ">
                {/* 装饰连线：在大屏下显示 */}
                <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100"></div>

                {[
                  { step: '01', title: '输入偏好', desc: '告诉 AI 您的目的地、预算及兴趣。' },
                  { step: '02', title: '智能生成', desc: '秒级生成包含食住行的完整方案。' },
                  { step: '03', title: '一键预订', desc: '确认行程，自动跳转各平台预订。' },
                  { step: '04', title: '行中伴游', desc: '实时语音讲解与突发状况调整。' },
                ].map((item, i) => (
                  <div key={i} className="relative group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                     {/* 序号：使用渐变色文字 */}
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-100 to-white stroke-2 mb-4 drop-shadow-sm select-none">
                       <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-500/20 to-purple-500/20">{item.step}</span>
                    </div>
                    
                    <h4 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                    
                    {/* 底部装饰条 */}
                    <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 w-0 group-hover:w-full transition-all duration-500 rounded-b-2xl"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 灵感画廊 - 优化版 */}
          <div className="mb-32">
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">本季灵感目的地</h2>
                <p className="text-gray-500 mt-2">AI 甄选国内最佳旅行地，发现不一样的中国</p>
              </div>
              <Link to="/attractions" className="px-6 py-2 rounded-full bg-white border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center shadow-sm">
                探索更多 <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {destinations.map((dest, i) => (
                <div key={i} className="group relative h-[400px] rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500">
                  <img 
                    src={dest.img} 
                    alt={dest.name} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                  />
                  {/* 渐变遮罩改为更通透的样式 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="backdrop-blur-md bg-white/10 border border-white/20 px-4 py-1.5 rounded-full w-fit mb-4">
                      <span className="text-xs font-bold text-white tracking-wide">{dest.tag}</span>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">{dest.name}</h3>
                    <div className="h-1 w-12 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 底部 CTA：替换了原来的纯色块，改为风景大图+磨砂玻璃卡片 */}
        <div className="relative py-32 overflow-hidden">
           {/* 背景图层 */}
           <div className="absolute inset-0">
             <img 
               src="https://images.unsplash.com/photo-1508804185872-d7badad00f7d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
               alt="Footer Background"
               className="w-full h-full object-cover"
             />
             {/* 叠加白色渐变，让图片不要太抢眼，与页面融合 */}
             <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]"></div>
           </div>

           {/* 玻璃态内容卡片 */}
           <div className="relative z-10 max-w-4xl mx-auto px-6">
             <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-12 md:p-16 text-center border border-white/50 shadow-2xl">
               <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                 准备好开启<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">下一段旅程</span>了吗？
               </h2>
               <p className="text-gray-600 mb-10 text-lg md:text-xl max-w-2xl mx-auto">
                 注册即刻获得 AI 智能旅行规划师，让每一次出发都不虚此行。
               </p>
               
               <div className="flex flex-col sm:flex-row justify-center gap-4">
                 <Link 
                   to="/register" 
                   className="px-10 py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 hover:scale-105 transition-all shadow-lg"
                 >
                   免费注册
                 </Link>
                 <Link 
                   to="/login" 
                   className="px-10 py-4 bg-white border border-gray-200 text-gray-900 rounded-xl font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
                 >
                   登录账号
                 </Link>
               </div>
             </div>
           </div>
        </div>

      </div>
    </Layout>
  );
};

export default Index;