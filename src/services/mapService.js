// src/services/mapService.js

// 建议将 API URL 放在环境变量中，这里暂时写死或从 import.meta.env 读取
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 

/**
 * 根据 session_id 获取行程地图数据
 * @param {string} sessionId 
 * @returns {Promise<Object>}
 */
export const getTravelMapData = async (sessionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/plan/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '行程数据获取失败');
    }

    return await response.json();
  } catch (error) {
    console.error("Map Service Error:", error);
    throw error;
  }
};