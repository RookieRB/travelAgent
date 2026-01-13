import React, { useState, useEffect, useRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { 
  MapPin, 
  Star, 
  Clock, 
  Users, 
  Search, 
  Heart, 
  Sparkles, 
  Filter,
  Loader2,
  ImageOff,
  ChevronLeft,  // 新增图标
  ChevronRight  // 新增图标
} from 'lucide-react';
import Layout from '../components/Layout';

// ⚠️ 请替换为你自己的高德 Key 和 安全密钥
const AMAP_KEY = import.meta.env.VITE_AMAP_KEY; 
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE;

const Attractions = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 分页状态
  const [pageIndex, setPageIndex] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12; // 每页显示数量

  const placeSearchRef = useRef(null);

  const categories = [
    { id: 'all', label: '全部推荐', keywords: '景点|旅游' },
    { id: 'nature', label: '🌲 自然风光', keywords: '风景名胜|公园|山|湖泊' },
    { id: 'culture', label: '🏛️ 文化古迹', keywords: '博物馆|古迹|寺庙|教堂|历史建筑' },
    { id: 'entertainment', label: '🎡 娱乐休闲', keywords: '游乐园|动物园|植物园|度假村' },
    { id: 'food', label: '🍜 美食体验', keywords: '美食街|特色餐饮|步行街' }
  ];

  useEffect(() => {
    window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE };
  }, []);

  useEffect(() => {
    AMapLoader.load({
      key: AMAP_KEY,
      version: "2.0",
      plugins: ["AMap.PlaceSearch"], 
    }).then((AMap) => {
      placeSearchRef.current = new AMap.PlaceSearch({
        pageSize: pageSize,
        pageIndex: 1, // 初始页码
        city: '杭州',
        citylimit: false,
        type: '风景名胜',
        extensions: 'all',
      });
      
      // 初始加载
      executeSearch('热门景点', 1);
      
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  // 核心搜索执行函数 (分离出页码参数)
  const executeSearch = (keyword, page) => {
    if (!placeSearchRef.current || !keyword) return;
    
    setLoading(true);
    
    // 1. 设置当前页码
    placeSearchRef.current.setPageIndex(page);
    
    // 2. 执行搜索
    placeSearchRef.current.search(keyword, (status, result) => {
      setLoading(false);
      if (status === 'complete' && result.info === 'OK') {
        const mappedData = result.poiList.pois.map(poi => transformPoiData(poi));
        setAttractions(mappedData);
        setTotalCount(result.poiList.count); // 更新总数
        setPageIndex(page); // 更新当前页状态
        
        // 滚动到列表顶部
        window.scrollTo({ top: 400, behavior: 'smooth' });
      } else {
        setAttractions([]);
        setTotalCount(0);
      }
    });
  };

  // 处理新的搜索请求 (重置为第1页)
  const handleNewSearch = (keyword) => {
    if (!keyword) return;
    executeSearch(keyword, 1);
  };

  // 处理翻页
  const handlePageChange = (newPage) => {
    // 构造当前实际使用的关键词 (结合分类)
    const categoryConfig = categories.find(c => c.id === selectedCategory);
    let query = categoryConfig ? categoryConfig.keywords : '景点';
    if (searchTerm) {
      // 如果搜索框有值，优先使用搜索框+分类
      query = selectedCategory === 'all' 
        ? searchTerm 
        : `${searchTerm} ${categoryConfig.keywords.split('|')[0]}`;
    }
    
    executeSearch(query, newPage);
  };

  const transformPoiData = (poi) => {
    let imageUrl = '';
    if (poi.photos && poi.photos.length > 0) {
      imageUrl = poi.photos[0].url;
    } else {
      const fallbackImages = [
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80'
      ];
      imageUrl = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
    }

    const rating = poi.biz_ext && poi.biz_ext.rating ? parseFloat(poi.biz_ext.rating) : (4.0 + Math.random()).toFixed(1);
    const price = poi.biz_ext && poi.biz_ext.cost && poi.biz_ext.cost.length > 0 ? poi.biz_ext.cost : '免费/未知';
    const description = poi.type || '暂无详细介绍，建议实地探索';

    return {
      id: poi.id,
      name: poi.name,
      location: `${poi.pname}·${poi.cityname}·${poi.adname}`,
      category: poi.type.split(';')[0],
      rating: rating,
      reviews: '999+',
      duration: '建议游玩 2-4 小时',
      price: price,
      image: imageUrl,
      description: `位于${poi.address}。${description}`,
      tags: poi.type.split(';').slice(0, 3)
    };
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    const categoryConfig = categories.find(c => c.id === catId);
    if (categoryConfig) {
      const query = searchTerm ? `${searchTerm} ${categoryConfig.keywords.split('|')[0]}` : categoryConfig.keywords;
      // 切换分类时，重置为第1页
      executeSearch(query, 1);
    }
  };

  const onSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      handleNewSearch(searchTerm);
    }
  };

  // 计算总页数 (高德 API 有时限制返回最大条数，这里做个保护)
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Layout>
      <div className="font-sans min-h-screen pb-12">
        
        {/* Header Section (保持不变) */}
        <div className="relative bg-gray-900 text-white rounded-2xl overflow-hidden mb-10 mx-4 md:mx-0 shadow-xl">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-60"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80")' }}
          ></div>
          <div className="relative z-10 px-8 py-16 md:py-20 text-center max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              AI 全域景点搜索
            </h1>
            <p className="text-lg text-gray-200 mb-8 font-light">
              接入高德大数据，实时获取全国千万级景点、美食与娱乐信息
            </p>
            
            <div className="max-w-2xl mx-auto relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={onSearchSubmit}
                placeholder="输入城市或景点名称 (如：北京 故宫)..."
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30 shadow-lg text-lg transition-shadow"
              />
              <button 
                onClick={() => handleNewSearch(searchTerm)}
                className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-medium transition-colors"
              >
                搜索
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 md:px-0 mb-8 overflow-x-auto no-scrollbar">
          <div className="flex space-x-3 min-w-max pb-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">正在搜索全网数据...</p>
          </div>
        )}

        {/* Attractions Grid */}
        {!loading && attractions.length > 0 && (
          <>
            <div className="px-4 md:px-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {attractions.map((attraction) => (
                <div 
                  key={attraction.id} 
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {/* Image Container */}
                  <div className="relative h-64 overflow-hidden bg-gray-100">
                    {attraction.image ? (
                      <img
                        src={attraction.image}
                        alt={attraction.name}
                        onError={(e) => {
                          e.target.onerror = null; 
                          e.target.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80";
                        }}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <ImageOff className="h-10 w-10 mb-2" />
                        <span className="text-xs">暂无图片</span>
                      </div>
                    )}
                    
                    <div className="absolute top-4 right-4">
                      <button className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-400 hover:text-red-500 transition-colors shadow-sm backdrop-blur-sm">
                        <Heart className="h-5 w-5 fill-current" />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center shadow-sm">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-current mr-1" />
                        <span className="text-xs font-bold text-gray-900">{attraction.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors line-clamp-1" title={attraction.name}>
                          {attraction.name}
                        </h3>
                        <div className="flex items-center text-gray-500 text-sm line-clamp-1">
                          <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                          {attraction.location}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 mb-4 bg-blue-50 rounded-lg p-3 relative flex-1">
                      <div className="absolute -top-1.5 -left-1.5 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm flex items-center">
                        <Sparkles className="h-2 w-2 mr-1" /> 高德信息
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 text-justify">
                        {attraction.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {attraction.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md line-clamp-1 max-w-[100px]">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          适游
                        </div>
                      </div>
                      <div className="flex items-baseline">
                        <span className="text-xs text-gray-400 mr-1">参考价</span>
                        <span className="text-lg font-bold text-blue-600">
                          {attraction.price === '免费/未知' ? '免费' : `¥${attraction.price}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Component */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 py-4">
                <button
                  onClick={() => handlePageChange(pageIndex - 1)}
                  disabled={pageIndex === 1}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                
                <span className="text-sm text-gray-600 font-medium px-4">
                  第 {pageIndex} 页 / 共 {totalPages > 50 ? '50+' : totalPages} 页
                </span>

                <button
                  onClick={() => handlePageChange(pageIndex + 1)}
                  disabled={pageIndex >= totalPages}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && attractions.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300 mx-4">
            <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">未找到相关结果</h3>
            <button 
              onClick={() => handleNewSearch('热门景点')}
              className="text-blue-600 hover:underline mt-2"
            >
              重置搜索
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Attractions;