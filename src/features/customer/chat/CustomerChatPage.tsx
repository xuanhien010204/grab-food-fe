import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Store, ShoppingBag, Loader2 } from 'lucide-react';
import { chatApi, userApi, orderApi, storeApi } from '../../../api/api';
import type { ConversationDto, ChatMessageDto, OrderDto } from '../../../types/swagger';
import ChatWindow from '../../../components/chat/ChatWindow';
import ConversationList from '../../../components/chat/ConversationList';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

function convKey(c: ConversationDto) {
    return `${c.otherUserId}-${c.storeId}`;
}

interface OrderedStore {
    storeId: number;
    storeName: string;
    managerId: number;
    managerName?: string;
}

export default function CustomerChatPage() {
    const [conversations, setConversations] = useState<ConversationDto[]>([]);
    const [orderedStores, setOrderedStores] = useState<OrderedStore[]>([]);
    const [selected, setSelected] = useState<ConversationDto | null>(null);
    const [messages, setMessages] = useState<ChatMessageDto[]>([]);
    const [convLoading, setConvLoading] = useState(true);
    const [msgLoading, setMsgLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number>(0);
    const [startingChat, setStartingChat] = useState<number | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        userApi.profile().then(res => {
            const data = res.data as any;
            setCurrentUserId(data?.id || 0);
        }).catch(() => {});
    }, []);

    const loadConversations = useCallback(async () => {
        try {
            const [convRes, ordersRes] = await Promise.all([
                chatApi.getConversations(),
                orderApi.getHistory(),
            ]);
            setConversations(Array.isArray(convRes.data) ? convRes.data : []);

            const orders: OrderDto[] = Array.isArray(ordersRes.data) ? ordersRes.data : [];
            const storeMap = new Map<number, OrderedStore>();
            orders.forEach(o => {
                if (o.storeId && !storeMap.has(o.storeId)) {
                    storeMap.set(o.storeId, {
                        storeId: o.storeId,
                        storeName: (o as any).storeName || `Cửa hàng #${o.storeId}`,
                        managerId: (o as any).managerId || 0,
                        managerName: (o as any).managerName,
                    });
                }
            });
            setOrderedStores(Array.from(storeMap.values()));
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
            
            console.log("Loaded messages for customer:", loadedMsgs);
            setMessages(loadedMsgs);
            
            await chatApi.markRead(conv.otherUserId, conv.storeId).catch(() => {});
            loadConversations();
        } catch (err) {
            console.error("Failed to load generic messages:", err);
            setMessages([]);
        } finally {
            setMsgLoading(false);
        }
    }, [loadConversations]);

    const handleSelect = (conv: ConversationDto) => {
        setSelected(conv);
        loadMessages(conv);
    };

    // Poll every 10s when a conversation is open
    useEffect(() => {
        if (!selected) return;
        const interval = setInterval(() => { loadMessages(selected!); }, 10_000);
        return () => clearInterval(interval);
    }, [selected, loadMessages]);

    const startChatWithStore = async (store: OrderedStore) => {
        let managerId = store.managerId;
        
        setStartingChat(store.storeId);
        try {
            // If managerId is missing or 0 (e.g. from order history), fetch store details
            if (!managerId) {
                const storeRes = await storeApi.getById(store.storeId);
                const storeData = storeRes.data as any;
                // Double check nested result if api.ts didn't unwrap
                const actualData = storeData?.result || storeData;
                managerId = actualData?.managerId || actualData?.tenantId || 0;
            }

            managerId = Number(managerId);

            if (!managerId || isNaN(managerId) || managerId <= 0) {
                toast.error('Không tìm thấy thông tin quản lý cửa hàng');
                setStartingChat(null);
                return;
            }

            const existing = conversations.find(c => c.storeId === store.storeId);
            if (existing) { 
                handleSelect(existing); 
                setStartingChat(null);
                return; 
            }

            await chatApi.send({ receiverId: managerId, storeId: store.storeId, content: 'Xin chào! Tôi muốn hỏi về đơn hàng.' });
            await loadConversations();

            
            // Try to auto-select the newly created conversation
            const res = await chatApi.getConversations();
            const convs: ConversationDto[] = Array.isArray(res.data) ? res.data : [];
            const newConv = convs.find(c => c.storeId === store.storeId);
            if (newConv) handleSelect(newConv);
            
            toast.success(`Đã bắt đầu chat với ${store.storeName}`);
        } catch (err) {
            console.error('Lỗi khi bắt đầu chat:', err);
            toast.error('Không thể bắt đầu cuộc trò chuyện');
        } finally {
            setStartingChat(null);
        }
    };

    const validStoreIds = new Set(orderedStores.map(s => s.storeId));
    const validConversations = conversations.filter(c => validStoreIds.has(c.storeId));
    const storesWithoutChat = orderedStores.filter(s => !conversations.find(c => c.storeId === s.storeId));

    return (
        <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            {/* Left sidebar */}
            <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[340px] lg:w-[380px] border-r border-gray-100 dark:border-gray-800 shrink-0`}>
                <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Đoạn chat</h1>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {convLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
                    ) : (
                        <>
                            {validConversations.length > 0 && (
                                <ConversationList
                                    conversations={validConversations}
                                    selectedKey={selected ? convKey(selected) : undefined}
                                    onSelect={handleSelect}
                                    loading={false}
                                />
                            )}
                            {storesWithoutChat.length > 0 && (
                                <div className="px-3 pt-2 pb-1">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1">Cửa hàng đã đặt</p>
                                    {storesWithoutChat.map(store => (
                                        <button
                                            key={store.storeId}
                                            onClick={() => startChatWithStore(store)}
                                            disabled={startingChat === store.storeId}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                                        >
                                            <div className="relative shrink-0">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-base">
                                                    {store.storeName.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{store.storeName}</p>
                                                <p className="text-xs text-orange-500">Nhấn để bắt đầu chat</p>
                                            </div>
                                            {startingChat === store.storeId
                                                ? <Loader2 className="w-4 h-4 animate-spin text-orange-400 shrink-0" />
                                                : <ShoppingBag className="w-4 h-4 text-gray-300 shrink-0" />
                                            }
                                        </button>
                                    ))}
                                </div>
                            )}
                            {orderedStores.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3 p-6 text-center">
                                    <ShoppingBag className="w-10 h-10 opacity-30" />
                                    <p className="text-sm">Đặt hàng trước để chat với cửa hàng</p>
                                    <button onClick={() => navigate('/')} className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors">
                                        Khám phá cửa hàng
                                    </button>
                                </div>
                            )}
                        </>
                    )}
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
                                otherUserName={selected.otherUserName || selected.storeName || 'Cửa hàng'}
                                onMessageSent={() => selected && loadMessages(selected)}
                                loading={msgLoading}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                        <Store className="w-20 h-20 opacity-20" />
                        <p className="text-sm font-medium">Chọn đoạn chat hoặc bắt đầu cuộc trò chuyện mới</p>
                    </div>
                )}
            </div>
        </div>
    );
}
