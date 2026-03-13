import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { ChatMessageDto } from '../../types/swagger';
import { chatApi } from '../../api/api';

interface ChatWindowProps {
    messages: ChatMessageDto[];
    currentUserId: number;
    otherUserId: number;
    storeId: number;
    otherUserName?: string;
    onMessageSent?: () => void;
    loading?: boolean;
}

// Group consecutive messages from the same sender
interface MessageGroup {
    senderId: number;
    isMine: boolean;
    messages: ChatMessageDto[];
}

function groupMessages(messages: ChatMessageDto[], currentUserId: number): MessageGroup[] {
    const groups: MessageGroup[] = [];
    for (const msg of messages) {
        const isMine = msg.senderId === currentUserId;
        const last = groups[groups.length - 1];
        if (last && last.senderId === msg.senderId) {
            last.messages.push(msg);
        } else {
            groups.push({ senderId: msg.senderId, isMine, messages: [msg] });
        }
    }
    return groups;
}

function Avatar({ name, size = 8 }: { name?: string; size?: number }) {
    const initials = (name ?? '?').charAt(0).toUpperCase();
    const colors = [
        'from-pink-400 to-rose-500',
        'from-purple-400 to-purple-600',
        'from-blue-400 to-blue-600',
        'from-green-400 to-emerald-600',
        'from-orange-400 to-orange-600',
        'from-teal-400 to-teal-600',
    ];
    const color = colors[(name?.charCodeAt(0) ?? 0) % colors.length];
    return (
        <div
            className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-xs shrink-0`}
        >
            {initials}
        </div>
    );
}

function formatGroupTime(msgs: ChatMessageDto[]) {
    const last = msgs[msgs.length - 1];
    if (!last || !last.sentAt) return '';
    const d = new Date(last.sentAt);
    if (isNaN(d.getTime())) return '';
    
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return 'Vừa xong';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
    if (d.toDateString() === now.toDateString())
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function ChatWindow({
    messages,
    currentUserId,
    otherUserId,
    storeId,
    otherUserName,
    onMessageSent,
    loading = false,
}: ChatWindowProps) {
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const groups = useMemo(() => groupMessages(messages, currentUserId), [messages, currentUserId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const autoResize = () => {
        const t = textareaRef.current;
        if (!t) return;
        t.style.height = 'auto';
        t.style.height = Math.min(t.scrollHeight, 120) + 'px';
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending) return;
        setSending(true);
        try {
            await chatApi.send({ receiverId: otherUserId, storeId, content: text });
            setInput('');
            if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
            onMessageSent?.();
        } catch (err) {
            console.error('Send message failed:', err);
        } finally {
            setSending(false);
        }
    };

    const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900">
            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 shadow-sm">
                <div className="relative">
                    <Avatar name={otherUserName} size={10} />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                </div>
                <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{otherUserName || 'Chat'}</p>
                    <p className="text-xs text-green-500 font-medium">Đang hoạt động</p>
                </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50 dark:bg-gray-950">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-7 h-7 animate-spin text-orange-400" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
                        <Avatar name={otherUserName} size={20} />
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{otherUserName}</p>
                        <p className="text-xs text-gray-400">Hãy bắt đầu cuộc trò chuyện 👋</p>
                    </div>
                ) : (
                    <>
                        {groups.map((group, gi) => (
                            <div
                                key={gi}
                                className={`flex items-end gap-2 ${group.isMine ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                {/* Avatar — only for received; show on last message of group */}
                                {!group.isMine && (
                                    <div className="w-8 shrink-0 self-end mb-0.5">
                                        <Avatar name={otherUserName} size={8} />
                                    </div>
                                )}

                                {/* Bubbles */}
                                <div className={`flex flex-col gap-0.5 max-w-[68%] ${group.isMine ? 'items-end' : 'items-start'}`}>
                                    {group.messages.map((msg, mi) => {
                                        const isFirst = mi === 0;
                                        const isLast = mi === group.messages.length - 1;

                                        // Messenger-style corner rounding
                                        let rounded = 'rounded-2xl';
                                        if (group.isMine) {
                                            if (!isFirst && !isLast) rounded = 'rounded-2xl rounded-r-md';
                                            else if (isFirst && !isLast) rounded = 'rounded-2xl rounded-br-md';
                                            else if (!isFirst && isLast) rounded = 'rounded-2xl rounded-tr-md';
                                        } else {
                                            if (!isFirst && !isLast) rounded = 'rounded-2xl rounded-l-md';
                                            else if (isFirst && !isLast) rounded = 'rounded-2xl rounded-bl-md';
                                            else if (!isFirst && isLast) rounded = 'rounded-2xl rounded-tl-md';
                                        }

                                        return (
                                            <div
                                                key={msg.id}
                                                className={`group relative px-3.5 py-2 text-sm leading-relaxed break-words animate-in fade-in slide-in-from-bottom-1 duration-200 ${rounded} ${
                                                    group.isMine
                                                        ? 'bg-orange-500 text-white'
                                                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-gray-700'
                                                }`}
                                            >
                                                {msg.content}
                                                {/* Timestamp on hover */}
                                                <span className={`absolute ${group.isMine ? 'right-full mr-2' : 'left-full ml-2'} bottom-1 text-[10px] text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}>
                                                    {(() => {
                                                        const date = new Date(msg.sentAt);
                                                        return isNaN(date.getTime()) ? '' : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                                                    })()}
                                                    {group.isMine && isLast && (
                                                        <span className="ml-1 text-orange-300">{msg.isRead ? '✓✓' : '✓'}</span>
                                                    )}
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {/* Group timestamp below last bubble */}
                                    <p className={`text-[10px] text-gray-400 mt-0.5 px-1 ${group.isMine ? 'text-right' : 'text-left'}`}>
                                        {formatGroupTime(group.messages)}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </>
                )}
            </div>

            {/* ── Input ── */}
            <div className="px-3 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
                <div className="flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-3xl px-3 py-1.5">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={input}
                        onChange={(e) => { setInput(e.target.value); autoResize(); }}
                        onKeyDown={handleKey}
                        placeholder="Aa"
                        className="flex-1 resize-none bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none max-h-28 py-1.5 placeholder:text-gray-400 leading-snug"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 mb-0.5 ${
                            input.trim()
                                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm scale-100'
                                : 'text-gray-300 dark:text-gray-600 scale-90'
                        }`}
                    >
                        {sending
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Send className="w-3.5 h-3.5" />
                        }
                    </button>
                </div>
                <p className="text-center text-[10px] text-gray-300 dark:text-gray-700 mt-1.5">Enter để gửi · Shift+Enter xuống dòng</p>
            </div>
        </div>
    );
}
