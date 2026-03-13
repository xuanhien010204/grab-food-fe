import type { ConversationDto } from '../../types/swagger';
import { cn } from '../../lib/utils';

interface ConversationListProps {
    conversations: ConversationDto[];
    selectedKey?: string;
    onSelect: (conv: ConversationDto) => void;
    loading?: boolean;
    emptyText?: string;
    title?: string;
}

function convKey(c: ConversationDto) {
    return `${c.otherUserId}-${c.storeId}`;
}

const AVATAR_COLORS = [
    'from-pink-400 to-rose-500',
    'from-purple-400 to-purple-600',
    'from-blue-400 to-blue-600',
    'from-green-400 to-emerald-600',
    'from-orange-400 to-orange-600',
    'from-teal-400 to-teal-600',
];

function getAvatarColor(name?: string) {
    return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}

function formatTime(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return 'Vừa xong';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút`;
    if (d.toDateString() === now.toDateString())
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export default function ConversationList({
    conversations,
    selectedKey,
    onSelect,
    loading = false,
    emptyText = 'Chưa có cuộc hội thoại nào',
}: ConversationListProps) {
    if (loading) {
        return (
            <div className="flex flex-col gap-0.5 p-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded-full w-2/3" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-3 p-6 text-center py-12">
                <span className="text-4xl">💬</span>
                <p className="text-sm">{emptyText}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-0.5 p-2">
            {conversations.map((conv) => {
                const key = convKey(conv);
                const isSelected = key === selectedKey;
                const hasUnread = conv.unreadCount > 0;
                const displayName = conv.otherUserName || `Người dùng #${conv.otherUserId}`;
                const avatarColor = getAvatarColor(displayName);
                const initial = displayName.charAt(0).toUpperCase();

                return (
                    <button
                        key={key}
                        onClick={() => onSelect(conv)}
                        className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150',
                            isSelected
                                ? 'bg-orange-50 dark:bg-orange-500/10'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800/60'
                        )}
                    >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className={cn(
                                'w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-base',
                                avatarColor
                            )}>
                                {initial}
                            </div>
                            {/* Online dot */}
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2">
                                <p className={cn(
                                    'text-sm truncate',
                                    hasUnread
                                        ? 'font-bold text-gray-900 dark:text-white'
                                        : isSelected
                                            ? 'font-semibold text-orange-600 dark:text-orange-400'
                                            : 'font-semibold text-gray-900 dark:text-white'
                                )}>
                                    {displayName}
                                </p>
                                <span className={cn(
                                    'text-[11px] shrink-0',
                                    hasUnread ? 'text-orange-500 font-semibold' : 'text-gray-400'
                                )}>
                                    {formatTime(conv.lastMessageAt)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                                <p className={cn(
                                    'text-xs truncate max-w-[85%]',
                                    hasUnread ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-gray-400'
                                )}>
                                    {conv.storeName && (
                                        <span className="text-gray-400 dark:text-gray-500">{conv.storeName} · </span>
                                    )}
                                    {conv.lastMessage || 'Chưa có tin nhắn'}
                                </p>
                                {/* Unread badge */}
                                {hasUnread && (
                                    <span className="ml-1 shrink-0 min-w-[20px] h-[20px] bg-orange-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-sm ring-2 ring-white dark:ring-gray-900 animate-in zoom-in">
                                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
