import { HomeIcon, Bot, Map, MapPin, Wallet, Calendar, LogIn,User } from "lucide-react";
import Index from "./pages/Index.jsx";
import AIAssistant from "./pages/AIAssistant.jsx";
import MapPlanning from "./pages/MapPlanning.jsx";
import Attractions from "./pages/Attractions.jsx";
import Budget from "./pages/Budget.jsx";
import Trips from "./pages/Trips.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";



/**
 * Central place for defining the navigation items. Used for navigation components and routing.
 */
export const navItems = [
  {
    title: "首页",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "AI助手",
    to: "/ai-assistant",
    icon: <Bot className="h-4 w-4" />,
    page: <AIAssistant />,
  },
  {
    title: "路线规划",
    to: "/map-planning",
    icon: <Map className="h-4 w-4" />,
    page: <MapPlanning />,
  },
  {
    title: "景区推荐",
    to: "/attractions",
    icon: <MapPin className="h-4 w-4" />,
    page: <Attractions />,
  },
  {
    title: "预算管理",
    to: "/budget",
    icon: <Wallet className="h-4 w-4" />,
    page: <Budget />,
  },
  {
    title: "我的行程",
    to: "/trips",
    icon: <Calendar className="h-4 w-4" />,
    page: <Trips />,
  },
   {
    title: "登录/注册",
    to: "/auth",
    icon: <LogIn className="h-4 w-4" />,
    page: <AuthPage />,
  },
  {
    title: "个人资料",
    to: "/profile",
    icon: <User className="h-4 w-4" />,
    page: <ProfilePage />,
  }
];
