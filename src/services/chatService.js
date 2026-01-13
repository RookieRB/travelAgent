// src/services/chatService.js

// 根据你的实际配置，这里可能是 '/api' 或者 'http://localhost:8000/api'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 

/**
 * 流式聊天请求
 * 对应后端 @app.post("/api/chat")
 */
export const streamChat = async (message, sessionId, onChunk, onDone, onError) => {
  try {
    // 1. 修改接口地址为 /chat，而不是 /chat/stream
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        stream: true // 2. 关键：告诉后端启用流式模式
      }),
    });

    if (!response.ok) {
      // 尝试读取后端返回的错误信息
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentSessionId = sessionId;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // 解码并添加到缓冲区
      buffer += decoder.decode(value, { stream: true });
      
      // 后端代码使用了 \n\n 作为分隔符
      const lines = buffer.split('\n\n');
      // 保留最后一个可能不完整的数据块
      buffer = lines.pop(); 

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim(); // 去掉 "data: "

          // 3. 处理后端发送的结束标记
          if (jsonStr === '[DONE]') {
             onDone(currentSessionId);
             return; 
          }
          
          try {
            const data = JSON.parse(jsonStr);

            if (data.error) {
              onError(data.error);
              return;
            }

            // 4. 获取内容 chunk
            if (data.content) {
              onChunk(data.content);
            }
            
            // ⚠️ 注意：根据你提供的 Python 代码，流式模式下 yield 的数据只包含 content
            // (yield f"data: {json.dumps({'content': chunk}, ...")
            // 如果你希望前端能拿到后端生成的 session_id，你需要修改 Python 代码
            // 在 yield 的 json 中加入 'session_id': session_id
            if (data.session_id) {
              currentSessionId = data.session_id;
            }

          } catch (e) {
            console.error('JSON parse error:', e, 'Data:', jsonStr);
          }
        }
      }
    }
    
    // 循环结束后调用完成（防止异常断开）
    onDone(currentSessionId);

  } catch (error) {
    console.error('Stream Request Error:', error);
    onError(error.message || '网络连接异常');
  }
};

/**
 * 清除历史记录 (保持不变)
 */
export const clearHistory = async (sessionId) => {
  if (!sessionId) return;
  try {
    await fetch(`${API_BASE_URL}/history/${sessionId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
};



export const chatService = {
  // 获取聊天历史
  async getChatHistory(sessionId) {
    const response = await fetch(`${API_BASE_URL}/chat/history/${sessionId}`);
    if (!response.ok) {
      throw new Error('获取历史记录失败');
    }
    return await response.json();
  },
  
  // 获取会话列表
  async getSessions(token) {
    const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await response.json();
  },
  
  // 删除会话
  async deleteSession(sessionId, token) {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await response.json();
  },
};