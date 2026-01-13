import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import AMapLoader from '@amap/amap-jsapi-loader';
import { 
  Map as MapIcon, Car, Train, Footprints, Navigation,
  ChevronRight, ChevronLeft, ArrowRight, X, MapPin, Loader2
} from 'lucide-react';
import Layout from '@/components/Layout';
import { getTravelMapData } from '@/services/mapService';

// 环境变量
const AMAP_KEY = import.meta.env.VITE_AMAP_KEY; 
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE; 

const MapPlanning = () => {
  const location = useLocation();
  const { sessionId } = location.state || {};

  // --- 状态管理 ---
  const [loading, setLoading] = useState(true);
  const [processingDay, setProcessingDay] = useState(false);
  const [rawPlan, setRawPlan] = useState(null); 
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [selectedLegIndex, setSelectedLegIndex] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const [isMapReady, setIsMapReady] = useState(false); // 新增：专门用于触发 Effect

  // --- 缓存 ---
  const [dayCache, setDayCache] = useState({}); 

  // --- Refs ---
  const mapRef = useRef(null); 
  const mapInstance = useRef(null); 
  const drivingInstance = useRef(null);
  const transferRef = useRef(null);
  const walkingRef = useRef(null);
  const geocoderRef = useRef(null);

  // 1. 初始化 AMap
  useEffect(() => {
    // [关键修复] 标记组件挂载状态，解决 React 18 Strict Mode 导致的异步竞态问题
    let isMounted = true; 
    
    // 临时存储控件实例，用于销毁时移除
    let scaleControl = null;
    let controlBar = null;

    window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE };
    
    AMapLoader.load({
      key: AMAP_KEY,
      version: "2.0",
      plugins: [
        "AMap.Driving", 
        "AMap.Transfer", 
        "AMap.Walking", 
        "AMap.Geocoder",
        "AMap.Scale", 
        "AMap.ControlBar"
      ], 
    }).then((AMap) => {
      // [关键修复] 如果组件已卸载（严格模式下第一次加载会走到这），直接返回，不再创建地图
      if (!isMounted) return;




       // --- 1. 防御性清理旧实例 ---
      if (mapInstance.current) {
        try {
          mapInstance.current.clearMap(); // 先清空图层
          mapInstance.current.destroy();
        } catch(e) {}
        mapInstance.current = null;
      }

      if (!mapRef.current) return;

      const map = new AMap.Map(mapRef.current, {
        viewMode: "3D",
        pitch: 45, 
        zoom: 11,
        center: [118.7969, 32.0603],
        mapStyle: 'amap://styles/whitesmoke',
      });
      


       // --- 3. 添加控件 (保存引用以供清理) ---
      scaleControl = new AMap.Scale();
      controlBar = new AMap.ControlBar({ position: { top: '10px', left: '10px' } });


      map.addControl(scaleControl);
      map.addControl(controlBar);
      mapInstance.current = map;

      // 初始化插件
      drivingInstance.current = new AMap.Driving({ 
        map: map, 
        policy: AMap.DrivingPolicy.LEAST_TIME,
        hideMarkers: false,
        showTraffic: false,
     });
      
      geocoderRef.current = new AMap.Geocoder({ city: "南京" }); 
      transferRef.current = new AMap.Transfer({ city: "南京", policy: AMap.TransferPolicy.LEAST_TIME });
      walkingRef.current = new AMap.Walking();
     

      setIsMapReady(true); 
      // 只有在组件依然挂载时才拉取数据
      if (isMounted) {
        fetchRawData();
      }

    }).catch(e => console.error("地图加载失败:", e));

    // 清理函数
    return () => {
      isMounted = false; // [关键修复] 标记为已卸载
      setIsMapReady(false); // 重置地图准备状态
      try {
        // [关键修复] 先清理插件，再销毁地图，防止内存泄漏或报错
        if (drivingInstance.current) {
            drivingInstance.current.clear(); // 清除路线
            drivingInstance.current = null;
        }

         // 2. 移除其他服务插件引用
        transferRef.current = null;
        walkingRef.current = null;
        geocoderRef.current = null;


         // 3. 安全销毁地图
        if (mapInstance.current) {
          // 关键修复：手动移除控件，防止 getOptions 报错
          if (scaleControl) mapInstance.current.removeControl(scaleControl);
          if (controlBar) mapInstance.current.removeControl(controlBar);
          
          mapInstance.current.clearMap(); // 清除所有覆盖物
          
          // 稍微延迟销毁，给 React 渲染循环一点时间 (可选，但推荐)
          const mapToDestroy = mapInstance.current;
          mapInstance.current = null;
          
          setTimeout(() => {
             try {
                mapToDestroy.destroy();
             } catch(e) {
                // 忽略销毁时的无关报错
                console.warn("Map destroy silent catch");
             }
          }, 0);
        }
      } catch (error) {
          console.warn("地图清理异常:", error);
      }
    };
  }, []);

  // 2. 获取原始数据
  const fetchRawData = async () => {
    try {
      const sid = sessionId || "session_20260108174248116227"; 
      const data = await getTravelMapData(sid);
      console.log("🔍 [Debug] 获取的数据:", data.data);
      setRawPlan(data.data.data);
    } catch (error) {
      console.error("Fetch raw data failed", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. 处理天数据 (已简化逻辑：不再拆分 POI)
  useEffect(() => {
    if (!rawPlan?.plan?.days || !isMapReady) return;

    const processCurrentDay = async () => {
      if (dayCache[activeDayIndex]) {
        return;
      }

      setProcessingDay(true);
      
      const dayRawData = rawPlan.plan.days[activeDayIndex];

      console.log("🔍 [Debug] 当前天原始数据:", dayRawData);
      const city = rawPlan.destination || "南京"; 
      console.log("🔍 [Debug] 当前天目标城市:", city);
      try {
        // --- A. 并行获取坐标 (一对一) ---
        const scheduleWithCoords  = []
        const BATCH_SIZE = 3; // 并发限制为 3

        for (let i = 0; i < dayRawData.schedule.length; i += BATCH_SIZE) {
          // 1. 截取当前批次的任务 (例如: [0,1,2], 然后 [3,4,5])
          const chunk = dayRawData.schedule.slice(i, i + BATCH_SIZE);
          
          console.log(`🔍 [Debug]正在处理第 ${Math.floor(i/BATCH_SIZE) + 1} 批坐标...`);

          // 2. 当前批次内部并行执行 (最多3个)
          const chunkResults = await Promise.all(
            chunk.map(async (item) => {
              // 调用之前封装好的带超时熔断的 searchCoordinate
              const coords = await searchCoordinate(item.poi, city);
              console.log(`🔍 [Debug] 搜索到坐标: ${item.poi} -> ${coords.lng},${coords.lat}`);
              if (!coords.lng || !coords.lat) {
                console.warn(`⚠️ [Skip] 坐标未找到: ${item.poi}`);
                return { ...item, lng: null, lat: null };
              }
              return { ...item, lng: coords.lng, lat: coords.lat };
            })
          );
           // 3. 收集结果
          scheduleWithCoords.push(...chunkResults);

          // 4. 【重要】批次之间强制休息一下
          // 即使这3个请求很快完成，也要暂停 300ms，防止瞬间 QPS 过高
          if (i + BATCH_SIZE < dayRawData.schedule.length) {
             await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
        
        console.log("🔍 [Debug] 包含坐标的 schedule:", scheduleWithCoords);

        // 过滤掉坐标无效的点
        const validScheduleItems = scheduleWithCoords.filter(item => item.lng && item.lat);
        console.log("🔍 [Debug] 有效坐标节点数:", validScheduleItems.length);

        // --- B. 计算交通 (点对点) ---
        const enrichedSchedule = await Promise.all(
          validScheduleItems.map(async (item, index) => {
            // 最后一个点不需要计算去下一站
            if (index === validScheduleItems.length - 1) return item; 

            const nextItem = validScheduleItems[index + 1];

            // 起点 -> 终点
            const startNode = { lng: item.lng, lat: item.lat };
            const endNode = { lng: nextItem.lng, lat: nextItem.lat };

            const transportOptions = await calculateTransportOptions(startNode, endNode, city);
            
            // 推荐策略
            const walkOpt = transportOptions.options.find(o => o.type === 'walk');
            if (walkOpt && parseInt(walkOpt.time) < 20) {
               transportOptions.options.forEach(o => o.recommend = (o.type === 'walk'));
            } else {
               transportOptions.options.forEach(o => o.recommend = (o.type === 'taxi'));
            }

            return {
              ...item,
              transport_to_next: transportOptions
            };
          })
        );
        
        // --- C. 准备全天绘图数据 ---
        // 既然没有子地点了，validPOIs 就是 enrichedSchedule 本身
        const processedDay = {
          ...dayRawData,
          schedule: enrichedSchedule,
          validPOIs: enrichedSchedule // 直接用于画图
        };

        setDayCache(prev => ({ ...prev, [activeDayIndex]: processedDay }));
        // updateMapRoute(processedDay);

      } catch (error) {
        console.error("Error processing day data:", error);
      } finally {
        setProcessingDay(false);
      }
    };

    processCurrentDay();
  }, [activeDayIndex, rawPlan,isMapReady]);


  // --- Map Update (统一渲染入口) ---
  
  // 提取当前天的数据
  const currentDayData = rawPlan ? (dayCache[activeDayIndex] || rawPlan.plan?.days[activeDayIndex]) : null;
  const currentDrawData = dayCache[activeDayIndex];
  
  // 生成数据指纹：防止 dayCache 对象引用变化导致的死循环
  // 只有当 schedule 长度或 session_id 变化时才认为是新数据
  const dataFingerprint = currentDrawData 
    ? `${activeDayIndex}-${currentDrawData.schedule?.length}` 
    : 'no-data';

  useEffect(() => {
    // 如果没有数据，或者正在计算中，不要画
    if (!currentDrawData || processingDay) return;
    
    console.log(`🗺️ [MapUpdate] 触发重绘: Day ${activeDayIndex + 1}, Leg: ${selectedLegIndex ?? 'ALL'}`);
    
    updateMapRoute(currentDrawData);

  // 依赖项：天数、选中的路段、以及数据的指纹
  // 这样当 processCurrentDay 完成并 setDayCache 后，这里会自动触发
  }, [activeDayIndex, selectedLegIndex, dataFingerprint]);

  // --- 高德 API 封装 (带清洗 + 超时熔断 + 自动重试) ---
  const searchCoordinate = (keyword, city, retryCount = 1) => { // 默认重试 1 次
    return new Promise((resolve) => {
      // 0. 基础校验
      if (!geocoderRef.current || !keyword) { 
        resolve({}); 
        return; 
      }
      
      // 1. 关键词清洗
      const cleanKeyword = keyword.replace(/\（.*?\）|\(.*?\)/g, '');
      const searchWord = cleanKeyword.length > 1 ? cleanKeyword : keyword;

      // 2. 定义超时处理
      let isEnded = false; // 防止回调和超时同时触发
      const timeoutMs = 3000; // 3秒超时足够了，10秒太长

      const timeoutId = setTimeout(async () => {
        if (isEnded) return;
        isEnded = true;

        if (retryCount > 0) {
          console.warn(`⏳ [Timeout] ${keyword} 超时，正在第 ${2 - retryCount} 次重试...`);
          // 递归重试，重试次数减 1
          const retryResult = await searchCoordinate(keyword, city, retryCount - 1);
          resolve(retryResult);
        } else {
          console.error(`❌ [Failed] ${keyword} 多次尝试仍超时，放弃。`);
          resolve({});
        }
      }, timeoutMs);
      
      // 3. 设置城市并搜索
      try {
        geocoderRef.current.setCity(city);
        geocoderRef.current.getLocation(searchWord, (status, result) => {
          if (isEnded) return; // 如果已经超时处理过了，回调就作废
          
          clearTimeout(timeoutId); // 清除定时器
          
          if (status === 'complete' && result.info === 'OK' && result.geocodes.length > 0) {
            isEnded = true;
            const location = result.geocodes[0].location;
            // console.log(`✅ [Found] ${keyword}`);
            resolve({ lng: location.lng, lat: location.lat });
          } else {
            // 如果 API 返回 "无结果" (不是超时)，通常重试也没用，但为了保险可以重试一次
            if (retryCount > 0) {
               // 稍微延迟一点再重试，给 API 喘息时间
               setTimeout(async () => {
                  if (isEnded) return;
                  isEnded = true;
                  console.warn(`⚠️ [Retry] ${keyword} API无结果，尝试重试...`);
                  const retryResult = await searchCoordinate(keyword, city, retryCount - 1);
                  resolve(retryResult);
               }, 500);
            } else {
               isEnded = true;
               console.warn(`⚠️ [Not Found] 未找到: ${keyword}`);
               resolve({});
            }
          }
        });
      } catch (e) {
        // 捕获同步错误（如 setCity 报错）
        if (!isEnded) {
            clearTimeout(timeoutId);
            isEnded = true;
            resolve({});
        }
      }
    });
  };

  const calculateTransportOptions = async (start, end, city) => {
    // 1. 基础校验
    if (!start.lng || !end.lng) return { summary: '无法计算', options: [] };

    const p1 = new AMap.LngLat(start.lng, start.lat);
    const p2 = new AMap.LngLat(end.lng, end.lat);

    // 2. 计算直线距离 (单位: 米)
    // AMap 2.0 中 LngLat 对象自带 distance 方法
    const straightDistance = p1.distance(p2);

    // 3. 定义请求任务 (按需剪枝)
    const tasks = [
      // 任务 0: 驾车 (用于打车估价，几乎总是需要)
      searchDriving(p1, p2),
      
      // 任务 1: 公交 (如果距离太近，比如 < 500米，其实没必要坐公交，可以优化，这里暂保留)
      searchTransit(p1, p2, city),
      
      // 任务 2: 步行 (核心优化：距离 > 3km 时，直接 Skip，不发请求)
      straightDistance < 3000 
        ? searchWalking(p1, p2) 
        : Promise.reject({ type: 'skip', msg: '距离太远不建议步行' })
    ];

    // 4. 并行执行
    const [driveRes, transitRes, walkRes] = await Promise.allSettled(tasks);

    const options = [];

    // --- 解析驾车/打车 ---
    if (driveRes.status === 'fulfilled') {
      const { time, distance } = driveRes.value;
      const distKm = distance / 1000;
      // 简单的天津/通用打车计价公式 (起步 11元/3km + 2.5元/km)
      let price = 11 + (distKm > 3 ? (distKm - 3) * 2.5 : 0);
      
      options.push({
        type: 'taxi',
        label: '打车',
        time: formatTime(time), // 秒转字符串
        rawTime: time,          // 保留原始秒数用于比较
        price: `约¥${Math.round(price)}`,
        desc: `最快 | ${distKm.toFixed(1)}km`
      });
    }

    // --- 解析公交 ---
    if (transitRes.status === 'fulfilled') {
       const { time, cost, segmentDesc } = transitRes.value;
       options.push({
         type: 'transit',
         label: '公交',
         time: formatTime(time),
         rawTime: time,
         price: `¥${cost || 2}`,
         desc: segmentDesc || "需换乘"
       });
    }

    // --- 解析步行 ---
    if (walkRes.status === 'fulfilled') {
      const { time, distance } = walkRes.value;
      options.push({
        type: 'walk',
        label: '步行',
        time: formatTime(time),
        rawTime: time,
        price: '免费',
        desc: `距离 ${(distance/1000).toFixed(1)}km`
      });
    }

    // 5. 兜底处理
    if (options.length === 0) {
        return { summary: '建议打车', options: [{ type: 'taxi', label: '建议打车', time: '-', price: '计价中', desc: '路线计算失败' }] };
    }

    // 6. 智能排序与推荐 Summary
    // 逻辑：优先推荐步行(如果<20分钟)，其次推荐公交(如果时间不比打车慢太多)，最后打车
    let bestMode = options[0]; 

    const walkOpt = options.find(o => o.type === 'walk');
    const transitOpt = options.find(o => o.type === 'transit');
    const taxiOpt = options.find(o => o.type === 'taxi');

    if (walkOpt && walkOpt.rawTime < 20 * 60) {
        // 步行小于 20 分钟，首推步行
        bestMode = walkOpt;
    } else if (transitOpt && taxiOpt && transitOpt.rawTime < taxiOpt.rawTime * 1.5) {
        // 如果公交时间不超过打车的 1.5 倍，推荐公交 (省钱)
        bestMode = transitOpt;
    } else if (taxiOpt) {
        // 否则推荐打车 (省时)
        bestMode = taxiOpt;
    }

    // 标记推荐项
    options.forEach(opt => {
        opt.recommend = (opt.type === bestMode.type);
    });

    // 排序：推荐的排第一，剩下的按时间排序
    options.sort((a, b) => {
        if (a.recommend) return -1;
        if (b.recommend) return 1;
        return a.rawTime - b.rawTime;
    });

    return { 
        summary: bestMode.label, // 例如 "步行", "打车"
        options: options 
    };
  };

  const searchDriving = (start, end) => new Promise((resolve, reject) => {
      if(!drivingInstance.current) return reject('No Instance');
      drivingInstance.current.search(start, end, (status, result) => {
        status === 'complete' ? resolve({ time: result.routes[0].time, distance: result.routes[0].distance }) : reject('Driving failed');
      });
  });

  const searchWalking = (start, end) => new Promise((resolve, reject) => {
      if(!walkingRef.current) return reject('No Instance');
      walkingRef.current.search(start, end, (status, result) => {
        status === 'complete' ? resolve({ time: result.routes[0].time, distance: result.routes[0].distance }) : reject('Walking failed');
      });
  });

  const searchTransit = (start, end, city) => new Promise((resolve, reject) => {
      if(!transferRef.current) return reject('No Instance');
      transferRef.current.setCity(city);
      transferRef.current.search(start, end, (status, result) => {
        if (status === 'complete' && result.plans && result.plans.length > 0) {
          const plan = result.plans[0];
          let desc = plan.segments?.map(s => (s.transit_mode === 'BUS' || s.transit_mode === 'SUBWAY') ? s.instruction : null).filter(Boolean).join('->').substring(0,15) + '...';
          resolve({ time: plan.time, cost: plan.cost, segmentDesc: desc });
        } else reject('Transit failed');
      });
  });

  const formatTime = (seconds) => {
    const min = Math.round(seconds / 60);
    if (min < 60) return `${min}分钟`;
    const h = Math.floor(min / 60);
    return `${h}小时${min % 60}分`;
  };

  


  // 定义一个 ref 来记录上一次请求时间
  const lastRequestTime = useRef(0);

  const updateMapRoute = (dayData, retryCount = 1) => {

    // 1. 基础节流 (Throttle)
    const now = Date.now();

    // 如果是重试调用(retryCount < 1)，则忽略节流限制，强制执行
    if (retryCount === 1 && now - lastRequestTime.current < 1000) {
      console.log("⚠️ [Map] 请求太频繁，已拦截");
      return;
    }
    lastRequestTime.current = now;

    if (!drivingInstance.current || !mapInstance.current || !dayData) return;

    const allPoints = dayData.validPOIs;
    
    if (!allPoints || allPoints.length < 2) return;

    drivingInstance.current.clear();

    if (selectedLegIndex !== null) {
      // --- 模式 A: 绘制特定路段 (Item N 到 Item N+1) ---
      const currentItem = dayData.schedule[selectedLegIndex];
      const nextItem = dayData.schedule[selectedLegIndex + 1];

      // 只要两个点都有坐标，就规划
      if (currentItem?.lng && nextItem?.lng) {
         console.log(`🔍 [Debug] 规划局部路线: ${currentItem.poi} -> ${nextItem.poi} (剩余重试: ${retryCount})`);
         
         drivingInstance.current.search(
          new AMap.LngLat(currentItem.lng, currentItem.lat), 
          new AMap.LngLat(nextItem.lng, nextItem.lat),               
          (status, result) => {
             if(status === 'complete') {
                console.log("✅ 局部路线规划成功");
                mapInstance.current.setFitView();
             } else {
                // ✅ [新增] 局部路线的重试逻辑
                const errorMsg = typeof result === 'string' ? result : result?.info || 'unknown';
                
                if ((errorMsg.includes('CUQPS') || errorMsg.includes('LIMIT')) && retryCount > 0) {
                    console.warn(`⏳ [Leg QPS] 局部路线限流，1.5秒后自动重试...`);
                    
                    setTimeout(() => {
                        // 递归调用
                        updateMapRoute(dayData, retryCount - 1);
                    }, 1500); // 局部路线轻量一些，等待 1.5秒
                } else {
                    console.error("❌ 局部路线规划失败:", status, result);
                }
             }
          }
        );
      }
    } else {
      // --- 模式 B: 绘制全天 (串联所有景点) ---
      
      // 1. 深度防御
      const startLng = Number(allPoints[0].lng);
      const startLat = Number(allPoints[0].lat);
      const endLng = Number(allPoints[allPoints.length - 1].lng);
      const endLat = Number(allPoints[allPoints.length - 1].lat);

      // 2. 检查坐标有效性
      if (isNaN(startLng) || isNaN(startLat) || isNaN(endLng) || isNaN(endLat)) {
        console.error("❌ [Fatal] 起点或终点坐标无效(NaN)", { startLng, startLat, endLng, endLat });
        return;
      }

      const start = new AMap.LngLat(startLng, startLat);
      const end = new AMap.LngLat(endLng, endLat);
      
      // 3. 处理途经点
      let waypoints = allPoints.slice(1, allPoints.length - 1).map((p, index) => {
        const wLng = Number(p.lng);
        const wLat = Number(p.lat);
        if (isNaN(wLng) || isNaN(wLat)) {
             console.warn(`⚠️ [Warn] 第 ${index+1} 个途经点坐标无效，已跳过`, p);
             return null;
        }
        return new AMap.LngLat(wLng, wLat);
      }).filter(p => p !== null); 
      
      // 防止点过多
      if (waypoints.length > 16) {
        console.warn(`ℹ️ [Info] 途经点过多(${waypoints.length})，进行抽稀处理...`);
        const step = Math.ceil(waypoints.length / 16);
        waypoints = waypoints.filter((_, index) => index % step === 0);
      }

      // 4. Debug 信息
      console.group(`🔍 [Debug] 准备发起全天路线规划 (剩余重试: ${retryCount})`);
      console.log("起点:", start.toString());
      console.log("终点:", end.toString());
      console.log("途经点数量:", waypoints.length);
      console.groupEnd();

      // 5. 调用 API
      drivingInstance.current.search(start, end, { waypoints }, (status, result) => {
        if(status === 'complete') {
           console.log("✅ 全天路线规划成功", result);
           if (result.routes && result.routes.length) {
               mapInstance.current.setFitView();
           }
        } else {
           // ✅ [保持] 全天路线的重试逻辑
           console.group("❌ 全天路线规划失败");
           console.error("Status:", status);
           console.error("Error Info (Result):", result);
           console.groupEnd();

           const errorMsg = typeof result === 'string' ? result : result?.info || 'unknown';
           
           if ((errorMsg.includes('CUQPS') || errorMsg.includes('LIMIT')) && retryCount > 0) {
              console.warn(`⏳ [Day QPS] 触发高德限流，2秒后自动重试...`);
              
              setTimeout(() => {
                  updateMapRoute(dayData, retryCount - 1);
              }, 2000); 
            } else {
               console.error("❌ 全天路线规划彻底失败:", status, result);
            }  
        }
      });
    }
  };

  const getIcon = (type, className = "w-4 h-4") => {
    switch(type) {
      case 'walk': return <Footprints className={className} />;
      case 'transit': return <Train className={className} />;
      case 'taxi': return <Car className={className} />;
      default: return <Navigation className={className} />;
    }
  };



  return (
    <Layout>
      <div className="flex h-[calc(100vh-120px)] w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200 relative">
        
        {loading && (
          <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center">
             <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
             <p className="text-gray-500 font-medium">AI 导游正在规划路线...</p>
          </div>
        )}

        {/* 左侧列表 */}
        <div className="w-[320px] bg-white flex flex-col border-r border-gray-200 z-10 shrink-0">
          <div className="p-4 border-b border-gray-100 bg-white shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 flex items-center mb-3">
              <MapIcon className="mr-2 h-5 w-5 text-blue-600" />
              {rawPlan?.destination || "行程"}导航
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {rawPlan?.plan?.days?.map((day, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveDayIndex(index);
                    setSelectedLegIndex(null);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center ${
                    activeDayIndex === index ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Day {day.day}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 bg-gray-50/50">
            {processingDay ? (
              <div className="flex flex-col items-center justify-center h-40 space-y-2 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs">正在计算今日坐标...</span>
              </div>
            ) : (
              currentDayData?.schedule?.map((item, idx, arr) => {
                const isLast = idx === arr.length - 1;
                const isSelected = selectedLegIndex === idx;
                const transportInfo = item.transport_to_next;

                return (
                  <div key={idx} className="relative flex flex-col group">
                    {!isLast && (
                      <div className={`absolute left-[15px] top-8 bottom-0 w-[2px] transition-colors duration-300 ${isSelected ? 'bg-blue-300' : 'bg-gray-200'}`}></div>
                    )}
                    <div className="flex items-start z-10 mb-4 cursor-default">
                      <div className={`
                        w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center text-xs font-bold border-2 shadow-sm mr-3 transition-all
                        ${isSelected ? 'border-blue-500 bg-blue-100 text-blue-700 scale-110' : 
                          idx === 0 ? 'bg-green-500 border-white text-white' :
                          isLast ? 'bg-red-500 border-white text-white' : 'bg-white border-gray-200 text-gray-500'}
                      `}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className={`font-bold text-sm ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>{item.poi}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{item.time || item.duration}</div>
                        
                        {!isLast && (
                          <div 
                            onClick={() => {
                              if (transportInfo) {
                                setSelectedLegIndex(idx);
                                setIsSidebarVisible(true);
                              }
                            }}
                            className={`
                              mt-2 p-2 rounded-lg border flex items-center justify-between transition-all
                              ${transportInfo ? 'cursor-pointer' : 'cursor-wait opacity-70'}
                              ${isSelected ? 'bg-blue-50 border-blue-200 shadow-inner' : 'bg-white border-gray-200 hover:border-blue-300'}
                            `}
                          >
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                               <div className={`p-1 rounded ${isSelected ? 'bg-blue-200' : 'bg-gray-100'}`}>
                                  {transportInfo ? getIcon(transportInfo.options?.find(o => o.recommend)?.type || 'car', "w-3 h-3") : <Loader2 className="w-3 h-3 animate-spin" />}
                               </div>
                               <span>{transportInfo ? "前往下一站" : "计算路程..."}</span>
                            </div>
                            <ChevronRight className={`w-3 h-3 text-gray-400 ${isSelected ? 'text-blue-500' : ''}`} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 中间地图 */}
        <div className="flex-1 relative bg-gray-100 border-r border-gray-200 overflow-hidden">
          <div ref={mapRef} className="w-full h-full z-0"></div>
          
          <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/50 flex gap-4 text-xs font-bold text-gray-600 z-10">
             <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm"></div>起点</div>
             {selectedLegIndex !== null ? (
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm animate-pulse"></div>当前段</div>
             ) : (
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-sm"></div>途经点</div>
             )}
             <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></div>终点</div>
          </div>

          {selectedLegIndex !== null && (
             <button
               onClick={() => setIsSidebarVisible(!isSidebarVisible)}
               className={`
                 absolute top-1/2 right-0 transform -translate-y-1/2 z-30
                 bg-white border border-gray-200 shadow-md py-4 pl-1 pr-0.5 rounded-l-xl
                 hover:bg-gray-50 hover:text-blue-600 text-gray-400 transition-all
               `}
               title={isSidebarVisible ? "收起详情" : "展开详情"}
             >
                {isSidebarVisible ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
             </button>
          )}
        </div>

        {/* 右侧详情 */}
        <div className={`
          bg-white flex flex-col z-20 shrink-0 border-l border-gray-200 shadow-xl overflow-hidden
          transition-all duration-300 ease-in-out
          ${selectedLegIndex !== null && isSidebarVisible ? 'w-[340px] opacity-100' : 'w-0 opacity-0'}
        `}>
           {selectedLegIndex !== null && currentDayData && (() => {
             const schedule = currentDayData.schedule;
             const currentLeg = schedule[selectedLegIndex];
             const nextPoi = schedule[selectedLegIndex + 1];
             const transport = currentLeg?.transport_to_next;

             if (!transport) return null;

             return (
               <div className="flex flex-col h-full w-[340px]">
                  <div className="bg-gray-50 p-5 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-blue-600" />
                        路线详情
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">AI 推荐最优交通方案</p>
                    </div>
                    <button onClick={() => setSelectedLegIndex(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                     <div className="flex items-center justify-between px-2 mb-4">
                        <div className="text-center w-1/3">
                           <div className="text-lg font-bold text-gray-800 truncate" title={currentLeg.poi}>{currentLeg.poi}</div>
                           <div className="text-xs text-gray-400">起点</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-300" />
                        <div className="text-center w-1/3">
                           <div className="text-lg font-bold text-gray-800 truncate" title={nextPoi.poi}>{nextPoi.poi}</div>
                           <div className="text-xs text-gray-400">终点</div>
                        </div>
                     </div>

                     {transport.options.map((opt, idx) => (
                       <div key={idx} className={`
                          relative p-4 rounded-xl border-2 transition-all cursor-default
                          ${opt.recommend ? 'border-blue-500 bg-blue-50/20' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}
                       `}>
                          {opt.recommend && (
                             <span className="absolute -top-2.5 left-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                               推荐
                             </span>
                          )}
                          <div className="flex justify-between items-start mb-2 mt-1">
                             <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${opt.recommend ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-500 shadow-sm'}`}>
                                  {getIcon(opt.type, "w-5 h-5")}
                                </div>
                                <div>
                                   <div className="font-bold text-gray-900">{opt.label}</div>
                                   <div className="text-xs text-gray-400">{opt.price}</div>
                                </div>
                             </div>
                             <div className="font-bold text-xl text-gray-900">{opt.time}</div>
                          </div>
                          <div className="text-xs text-gray-500 leading-relaxed border-t border-dashed border-gray-200 pt-2 mt-2">
                            {opt.desc}
                          </div>
                       </div>
                     ))}
                  </div>

                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div 
                      onClick={() => setSelectedLegIndex(null)}
                      className="w-full bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all flex items-center gap-3 group"
                    >
                       <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100 group-hover:bg-blue-100 transition-colors">
                          <MapPin className="w-6 h-6 text-blue-500" />
                       </div>
                       <div className="flex-1">
                          <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600">返回全天总览</div>
                          <div className="text-xs text-gray-500">查看完整路线图</div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                    </div>
                  </div>
               </div>
             );
           })()}
        </div>

      </div>
    </Layout>
  );
};

export default MapPlanning;