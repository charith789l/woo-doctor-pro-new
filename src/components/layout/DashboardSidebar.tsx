
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  User,
  Settings,
  Crown,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/authStore";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/app/dashboard" },
  { icon: Package, label: "Product Management", href: "/app/products" },
  { icon: ShoppingCart, label: "Order Management", href: "/app/orders" },
  { icon: BarChart3, label: "Reports", href: "/app/reports" },
  { icon: User, label: "Profile", href: "/app/profile" },
  { icon: Settings, label: "Settings", href: "/app/settings" },
];

const DashboardSidebar = () => {
  const context = useSidebar();
  const location = useLocation();
  const { signOut } = useAuthStore();

  const isCollapsed = context?.state === "collapsed";
  const toggleSidebar = () => context?.toggleSidebar?.();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const sidebarVariants = {
    expanded: {
      width: "290px", // Increased from 280px to 290px
      transition: { duration: 0.2 },
    },
    collapsed: {
      width: "70px",
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.div
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      className="fixed top-0 left-0 h-screen bg-gradient-to-t from-fuchsia-600 to-pink-600 dark:from-black dark:to-gray-900 dark:bg-gradient-to-b shadow-xl z-40 flex flex-col"
      style={{ width: isCollapsed ? "70px" : "290px" }} // Updated width here too
    >
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        <motion.div className="flex items-center">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-2xl font-bold text-white"
              >
                Woo Doctor
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
          }}
          className="absolute -right-4 top-6 p-1 rounded-full bg-fuchsia-600 dark:bg-gray-800 hover:bg-black dark:hover:bg-gray-700 active:bg-black text-white shadow-lg border border-white/20 z-50"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-white" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-white" />
          )}
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className={`mt-8 space-y-4 ${isCollapsed ? "px-2" : "px-4"}`}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <Link
                to={item.href}
                onClick={(e) => {
                  // Don't toggle sidebar state on link click
                  e.stopPropagation();
                }}
                className={`flex items-center ${
                  isCollapsed ? "justify-center px-2" : "px-6"
                } py-3 text-white transition-all duration-300 rounded-lg
                ${
                  isActive(item.href)
                    ? "bg-black/30 dark:bg-white/10 text-white font-medium"
                    : "hover:bg-black/20 dark:hover:bg-white/5 hover:translate-x-1"
                }`}
              >
                <item.icon
                  className={`w-8 h-8 text-white ${
                    isCollapsed ? "mx-auto" : "min-w-[32px]"
                  }`}
                />
                {!isCollapsed && (
                  <span className="ml-3 font-medium text-sm">{item.label}</span>
                )}
              </Link>
              {index < menuItems.length - 1 && (
                <div className="my-4 border-t border-white/10" />
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className={`mt-auto p-4 ${isCollapsed ? "px-2" : "px-4"}`}>
        <Link
          to="/app/premium"
          onClick={(e) => {
            // Don't toggle sidebar state on link click
            e.stopPropagation();
          }}
          className={`flex items-center ${
            isCollapsed ? "justify-center px-2" : "px-6"
          } py-3 text-white transition-all duration-300 rounded-lg bg-gradient-to-r from-pink-500 to-pink-700 dark:from-purple-700 dark:to-pink-900 hover:shadow-lg`}
        >
          <Crown
            className={`w-8 h-8 text-white ${
              isCollapsed ? "mx-auto" : "min-w-[32px]"
            }`}
          />
          {!isCollapsed && (
            <span className="ml-3 font-medium text-sm">Upgrade To Premium</span>
          )}
        </Link>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            signOut();
          }}
          className={`flex items-center w-full ${
            isCollapsed ? "justify-center px-2" : "px-6"
          } py-3 mt-2 text-white transition-all duration-300 rounded-lg cursor-pointer bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 active:bg-black/30`}
        >
          <LogOut
            className={`w-8 h-8 text-white ${
              isCollapsed ? "mx-auto" : "min-w-[32px]"
            }`}
          />
          {!isCollapsed && (
            <span className="ml-3 font-medium text-sm">Logout</span>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default DashboardSidebar;
