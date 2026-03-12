import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, ArrowLeft } from 'lucide-react';

import { chatApi, userApi } from '../../../api/api';
import type { ConversationDto, ChatMessageDto } from '../../../types/swagger';
import ChatWindow from '../../../components/chat/ChatWindow';
import ConversationList from '../../../components/chat/ConversationList';

function convKey(c: ConversationDto) {
    return `${c.otherUserId}-${c.storeId}`;
}

export default function ManagerChatPage() {
    const [conversations, setConversations] = useState<ConversationDto[]>([]);
    const [selected, setSelected] = useState<ConversationDto | null>(null);
    const [messages, setMessages] = useState<ChatMessageDto[]>([]);
    const [convLoading, setConvLoading] = useState(true);
    const [msgLoading, setMsgLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number>(0);

    useEffect(() => {
        userApi.profile().then(res => {
            const data = res.data as any;
            setCurrentUserId(data?.id || 0);
        }).catch(() => {});
    }, []);

    const loadConversations = useCallback(async () => {
        try {
            const res = await chatApi.getConversations();
            // Filter conversations to only include customer chats (storeId > 0)
            const allConvs = Array.isArray(res.data) ? res.data : [];
            setConversations(allConvs.filter((c: ConversationDto) => c.storeId > 0));
        } catch {
            setConversations([]);
        } finally {
            setConvLoading(false);
        }
    }, []);

    useEffect(() => { loadConversations(); }, [loadConversations]);

    const loadMessages = useCallback(async (conv: ConversationDto) => {
        setMsgLoading(true);
        try {
            const res = await chatApi.getMessages(conv.otherUserId, conv.storeId);
            const data = res.data as any;
            
            let loadedMsgs: ChatMessageDto[] = [];
            if (Array.isArray(data)) {
                loadedMsgs = data;
            } else if (data && typeof data === 'object') {
                loadedMsgs = data.items || data.data || data.messages || data.result || [];
                if (!Array.isArray(loadedMsgs)) {
                    const arr = Object.values(data).find(Array.isArray);
                    loadedMsgs = (arr as ChatMessageDto[]) || [];
                }
            }
            
            // Đảm bảo tin nhắn được sắp xếp theo trình tự thời gian (cũ nhất -> mới nhất)
            loadedMsgs.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
            
            console.log("Loaded messages for manager:", loadedMsgs);
            setMessages(loadedMsgs);
            
            await chatApi.markRead(conv.otherUserId, conv.storeId).catch(() => {});
            loadConversations();
        } catch (err) {
            console.error("Failed to load messages:", err);
            setMessages([]);
        } finally {
            setMsgLoading(false);
        }
    }, [loadConversations]);

    const handleSelect = (conv: ConversationDto) => {
        setSelected(conv);
        loadMessages(conv);
    };

    // Customer tab: 10s polling
    useEffect(() => {
        if (!selected) return;
        const interval = setInterval(() => loadMessages(selected), 10_000);
        return () => clearInterval(interval);
    }, [selected, loadMessages]);

    return (
        <div className="flex h-[calc(100vh-88px)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            {/* Left sidebar */}
            <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[340px] lg:w-[380px] border-r border-gray-100 dark:border-gray-800 shrink-0`}>
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Đoạn chat</h1>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <ConversationList
                        conversations={conversations}
                        selectedKey={selected ? convKey(selected) : undefined}
                        onSelect={handleSelect}
                        loading={convLoading}
                        emptyText="Chưa có cuộc trò chuyện nào với khách hàng."
                    />
                </div>
            </div>

            {/* Right: Chat area */}
            <div className={`${selected ? 'flex' : 'hidden md:flex'} flex-col flex-1 overflow-hidden`}>
                {selected ? (
                    <>
                        <button onClick={() => setSelected(null)} className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-gray-100 text-orange-600 font-semibold text-sm bg-white dark:bg-gray-900">
                            <ArrowLeft className="w-4 h-4" /> Quay lại
                        </button>
                        <div className="flex-1 overflow-hidden">
                            <ChatWindow
                                messages={messages}
                                currentUserId={currentUserId}
                                otherUserId={selected.otherUserId}
                                storeId={selected.storeId}
                                otherUserName={selected.otherUserName}
                                onMessageSent={() => selected && loadMessages(selected)}
                                loading={msgLoading}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                        <MessageCircle className="w-20 h-20 opacity-20" />
                        <p className="text-sm font-medium">Chọn cuộc trò chuyện để bắt đầu</p>
                    </div>
                )}
            </div>
        </div>
    );
}
