
import React, { useContext } from 'react';
import { ICONS } from '../constants/index';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useStudentNotificationsContext } from '../contexts/StudentNotificationContext';
import { AdminDataContext } from '../contexts/AdminDataContext';
import { ZoomControls } from './common/ZoomControls';

interface HeaderProps {
    title: string;
    isScrolled: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, isScrolled }) => {
    const { userRole } = useAuth();
    const { setCurrentPage } = useNavigation();
    
    let notificationCount = 0;

    if (userRole === 'aluno') {
        try {
            const notifContext = useStudentNotificationsContext();
            notificationCount = notifContext.unreadNotificationCount;
        } catch { /* ignore */ }
    } else if (userRole === 'admin') {
        const adminData = useContext(AdminDataContext);
        notificationCount = adminData?.unreadNotificationCount || 0;
    }
    
    // Only show notification button for students (and possibly admin if logic persists there)
    const showNotificationsButton = userRole === 'aluno';

    return (
        <header role="banner" className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 flex items-center justify-end relative flex-shrink-0 hc-bg-override hc-border-override transition-all duration-300 ease-in-out ${isScrolled ? 'p-2 sm:p-3' : 'p-3 sm:p-4'}`}>
            
            {/* Centered Title Container */}
            <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                 <h1 id="page-main-heading" tabIndex={-1} className={`font-bold text-slate-800 dark:text-slate-100 hc-text-override transition-all duration-300 ease-in-out truncate max-w-[calc(100%-10rem)] outline-none ${isScrolled ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}>{title}</h1>
            </div>

            {/* Right-aligned Actions */}
            <div className={`flex items-center space-x-4 transition-all duration-300 ease-in-out ${isScrolled ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100'}`}>
                <div className="hidden sm:block">
                    <ZoomControls />
                </div>
                {showNotificationsButton && (
                    <button 
                        onClick={() => setCurrentPage('notifications')} 
                        className="relative text-slate-500 hover:text-slate-800 p-3 rounded-full hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 hc-button-override"
                        aria-label={`Notificações (${notificationCount} não lidas)`}
                    >
                        <span aria-hidden="true">{ICONS.notifications}</span>
                        {notificationCount > 0 && (
                            <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900" aria-hidden="true">
                                {notificationCount}
                            </span>
                        )}
                    </button>
                )}
            </div>
        </header>
    );
};
