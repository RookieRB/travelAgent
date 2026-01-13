import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom'; // 1. 引入路由钩子
import { 
  Send, 
  Bot, 
  User, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Sparkles, 
  RefreshCw,
  Zap,
  ChevronRight,
  Loader2,
  Map as MapIcon, // 引入地图图标
  ArrowRight
} from 'lucide-react';
import Layout from '../components/Layout';
import { streamChat, chatService  } from '@/services/chatService';

import ConfirmModal from '@/components/ConfirmModal';


const AIAssistant = () => {
  const navigate = useNavigate(); // 2. 初始化 navigate
  
  // ... (状态定义保持不变)
  const initialMessage = {
    id: 'welcome',
    type: 'bot',
    content: '嗨！我是您的专属旅行 AI 规划师。✈️\n\n您可以告诉我：\n1. 想去哪里？(如：日本、云南)\n2. 玩几天？\n3. 预算大概多少？\n\n我会为您生成一份包含**路线**、**酒店**和**预算**的详细方案。',
    timestamp: new Date()
  };

  const [messages, setMessages] = useState([initialMessage]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(localStorage.getItem('chat_session_id') || '');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // 新增：加载历史的状态

   // 新增：控制弹窗显示的 state
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);



  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('chat_session_id', sessionId);
    }
  }, [sessionId]);


  // 🔥 核心修改：组件挂载时，如果存在 sessionId，则从后端拉取历史记录
  useEffect(() => {
    const fetchHistory = async () => {
      if (!sessionId) return; // 没有 ID 就不拉取，显示默认欢迎语

      setIsLoadingHistory(true);
      try {
        console.log("正在加载历史记录, SessionID:", sessionId);
        const historyData = await chatService.getChatHistory(sessionId);
        
        // ⚠️ 数据转换：后端返回的字段可能与前端不一致，需要映射
        // 假设后端返回结构为: [{ role: 'user', content: '...', created_at: '...' }, ...]
        if (historyData && historyData.length > 0) {
          const formattedMessages = historyData.map((item, index) => ({
            id: item.id || `history-${index}`, // 如果后端没返回 id，生成一个临时的
            type: item.role === 'user' ? 'user' : 'bot', // 转换角色
            content: item.content,
            timestamp: item.created_at ? new Date(item.created_at) : new Date()
          }));
          
          // 如果历史记录里没有数据，还是保留欢迎语；如果有数据，则覆盖
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("加载历史记录失败:", error);
        // 如果 404 或 session 失效，可能需要重置 session_id
        // localStorage.removeItem('chat_session_id');
        // setSessionId('');
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空数组依赖，只在组件初始化时执行一次 (或者依赖 [sessionId] 如果你支持切换会话)



  // 3. 跳转到路线规划页面的处理函数
  const handleNavigateToMap = (contextText) => {
    // 这里可以解析 contextText (AI的回复)，提取地点
    // 简单起见，我们直接跳转，并可以通过 state 传递参数
    if (!sessionId) {
      alert("未找到会话信息，无法生成地图");
      return;
    }

    // 跳转并携带 session_id
    navigate('/map-planning', { 
      state: { 
        sessionId: sessionId,
        fromChat: true 
      } 
    });
  };

  //(handleSendMessage, handleClearChat 等逻辑保持不变)
  const handleSendMessage = async (text = inputMessage) => {
    const content = text.trim();
    if (!content || isTyping) return;

    const userMsgId = Date.now();
    setMessages(prev => [...prev, {
      id: userMsgId,
      type: 'user',
      content: content,
      timestamp: new Date()
    }]);
    setInputMessage('');
    setIsTyping(true);

    const botMsgId = userMsgId + 1;
    setMessages(prev => [...prev, {
      id: botMsgId,
      type: 'bot',
      content: '', 
      timestamp: new Date()
    }]);

    let fullResponse = '';

    await streamChat(
      content,
      sessionId,
      (chunk) => {
        fullResponse += chunk;
        setMessages(prev => 
          prev.map(msg => msg.id === botMsgId ? { ...msg, content: fullResponse } : msg)
        );
      },
      (newSessionId) => {
        setIsTyping(false);
        if (newSessionId) setSessionId(newSessionId);
      },
      (error) => {
        setIsTyping(false);
        setMessages(prev => 
          prev.map(msg => msg.id === botMsgId ? { ...msg, content: fullResponse + `\n\n[系统错误: ${error}]` } : msg)
        );
      }
    );
  };
  
  // 点击右上角刷新图标时调用
  const handleOpenClearModal = () => {
    setIsClearModalOpen(true);
  };
  
  // 真正的清理逻辑 (传给组件的 onConfirm)
  const executeClearChat = async () => {
    // 1. (可选) 通知后端
    if (sessionId) { 
        try {
            // await chatService.deleteSession(sessionId); 
            console.log("Session deleted from server");
        } catch (e) {
            console.error("Delete session failed", e);
        }
    }

    // 2. 清理本地
    localStorage.removeItem('chat_session_id');
    
    // 3. 重置状态
    setSessionId('');
    setMessages([initialMessage]);
    setInputMessage('');
  };

  const quickQuestions = [
    { icon: '🏔️', text: '推荐川西 5 日自驾路线' },
    { icon: '💰', text: '预算 3000 元适合去哪里？' },
    { icon: '👩‍❤️‍👨', text: '适合情侣的浪漫海岛推荐' },
    { icon: '👨‍👩‍👧', text: '带 5 岁孩子去哪里玩比较好？' }
  ];

  // 4. 辅助函数：判断是否包含路线规划内容 (关键词匹配)
  const hasRoutePlan = (text) => {
    const keywords = ['路线', '行程', 'Day', '规划', '出发'];
    return keywords.some(keyword => text.includes(keyword)) && text.length > 50;
  };

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-12 h-[calc(100vh-140px)]">
        
        {/* Main Chat Area */}
        <div className="flex-1 bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col overflow-hidden relative">
          {/* Header (不变) */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md z-10">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">AI 旅行规划师</h2>
                  <div className="flex items-center space-x-1.5">
                   {/* 如果正在加载历史记录，显示加载中 */}
                   {isLoadingHistory ? (
                     <span className="text-xs text-blue-500 font-medium flex items-center">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" /> 同步历史记录中...
                     </span>
                   ) : (
                     <>
                        <span className="relative flex h-2.5 w-2.5">
                            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isTyping ? 'bg-blue-400 animate-ping' : 'bg-green-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isTyping ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                        </span>
                        <span className="text-xs text-gray-500 font-medium">{isTyping ? 'AI 正在思考...' : '在线 - 极速响应'}</span>
                     </>
                   )}
                </div>
              </div>
            </div>
            <button 
              onClick={handleOpenClearModal} // <--- 这里绑定打开弹窗的方法
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 scroll-smooth">
            {messages.map((message) => (
              <div key={message.id} className={`flex w-full ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[90%] md:max-w-[75%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                  
                  {/* Avatar */}
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center shadow-sm ${message.type === 'user' ? 'bg-gray-900' : 'bg-white border border-gray-100'}`}>
                    {message.type === 'user' ? <User className="h-5 w-5 text-white" /> : <Sparkles className="h-5 w-5 text-blue-600" />}
                  </div>

                  {/* Bubble */}
                  <div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-5 py-4 shadow-sm text-sm md:text-base leading-relaxed overflow-hidden ${
                      message.type === 'user' 
                        ? 'bg-gray-900 text-white rounded-2xl rounded-tr-sm' 
                        : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
                    }`}>
                      {/* Loading */}
                      {message.type === 'bot' && message.content === '' && isTyping ? (
                         <div className="flex space-x-1 h-6 items-center">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                         </div>
                      ) : (
                         <>
                           {message.type === 'bot' ? (
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                // 基础文本
                                p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-7" {...props} />,
                                
                                // 列表优化
                                ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 mb-3 pl-2" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 mb-3 pl-2" {...props} />,
                                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                
                                // 标题增强
                                strong: ({node, ...props}) => <span className="font-bold text-gray-900" {...props} />,
                                h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-3 text-gray-900 border-b pb-2" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3 text-blue-700 flex items-center" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2 text-gray-800" {...props} />,
                                
                                // 引用块优化
                                blockquote: ({node, ...props}) => (
                                  <blockquote className="border-l-4 border-blue-400 bg-blue-50/50 pl-4 py-2 my-3 rounded-r-lg text-gray-700 italic" {...props} />
                                ),
                                
                                // 分割线
                                hr: () => <hr className="my-6 border-gray-200" />,
                                
                                // 表格特别优化：支持横向滚动，样式更美观
                                table: ({node, ...props}) => (
                                  <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm" {...props} />
                                  </div>
                                ),
                                thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
                                th: ({node, ...props}) => (
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap" {...props} />
                                ),
                                tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
                                tr: ({node, ...props}) => <tr className="hover:bg-gray-50 transition-colors" {...props} />,
                                td: ({node, ...props}) => (
                                  <td className="px-4 py-3 whitespace-normal text-gray-700" {...props} />
                                ),

                                // Action Link (保持你的逻辑)
                                a: ({node, href, children, ...props}) => {
                                  if (href && href.startsWith('action:')) {
                                    const action = href.split(':')[1];
                                    if (action === 'map') {
                                      return (
                                        <button 
                                          onClick={() => onNavigateToMap(mapData)}
                                          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium underline decoration-blue-300 underline-offset-4"
                                        >
                                          <MapIcon className="w-4 h-4 mr-1" />
                                          {children}
                                        </button>
                                      )
                                    }
                                  }
                                  return <a className="text-blue-600 hover:underline cursor-pointer break-all" target="_blank" rel="noopener noreferrer" href={href} {...props}>{children}</a>
                                },
                              }}
                                  >
                              {message.content}
                            </ReactMarkdown>
                           ) : (
                             <p className="whitespace-pre-line break-words">{message.content}</p>
                           )}

                           {/* 
                             6. 智能动作卡片 (Smart Action Card) 
                             当内容包含路线规划相关关键词，且不在打字中时显示
                           */}
                           {message.type === 'bot' && hasRoutePlan(message.content) && !isTyping && (
                             <div className="mt-4 pt-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-500">
                               <div 
                                 onClick={() => handleNavigateToMap(message.content)}
                                 className="group flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-xl cursor-pointer transition-all border border-blue-100 hover:border-blue-200"
                               >
                                 <div className="flex items-center space-x-3">
                                   <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                     <MapIcon className="h-5 w-5" />
                                   </div>
                                   <div>
                                     <h4 className="font-bold text-blue-900 text-sm">生成可视化路线图</h4>
                                     <p className="text-xs text-blue-600/80">在地图上查看详细导航与耗时</p>
                                   </div>
                                 </div>
                                 <div className="bg-white/50 p-1.5 rounded-full text-blue-600 group-hover:bg-white group-hover:translate-x-1 transition-all">
                                   <ArrowRight className="h-4 w-4" />
                                 </div>
                               </div>
                             </div>
                           )}
                         </>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 mt-1.5 px-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area (保持不变) */}
          <div className="p-4 md:p-6 bg-white border-t border-gray-100">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isTyping && handleSendMessage()}
                placeholder={isTyping ? "AI 正在回复中..." : "输入您的旅行想法..."}
                disabled={isTyping}
                className="w-full pl-6 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all shadow-inner text-gray-700 placeholder-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isTyping}
                className={`absolute right-2 p-2.5 rounded-xl transition-all ${
                  inputMessage.trim() && !isTyping
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
            <div className="text-center mt-2">
              <p className="text-xs text-gray-400">AI 模型可能产生错误信息，请核实重要信息</p>
            </div>
          </div>
        </div>
        
        {/* Right Sidebar (保持不变) */}
        <div className="hidden lg:flex flex-col w-80 space-y-6">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
             {/* ... */}
             <div className="flex items-center space-x-2 mb-4">
              <Zap className="h-5 w-5 text-yellow-500 fill-current" />
              <h3 className="font-bold text-gray-900">灵感激发</h3>
            </div>
            <div className="space-y-3">
              {quickQuestions.map((item, index) => (
                <button
                  key={index}
                  onClick={() => !isTyping && handleSendMessage(item.text)}
                  disabled={isTyping}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-transparent rounded-xl text-sm transition-all duration-200 group flex items-start disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="mr-2 text-base">{item.icon}</span>
                  <span className="flex-1 text-gray-600 group-hover:text-blue-700">{item.text}</span>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 text-blue-500 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
          {/* ... */}
        </div>
      </div>

       <ConfirmModal 
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={executeClearChat}
        title="开启新的旅程？"
        description="开启新对话将清除当前的聊天记录，AI 将忘记之前的上下文。确定要重新开始规划吗？"
        confirmText="确定开启"
        cancelText="再想想"
      />
    </Layout>
  );
};

export default AIAssistant;