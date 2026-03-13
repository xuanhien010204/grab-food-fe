import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, UtensilsCrossed } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#FCF9F5] flex flex-col items-center justify-center p-6 text-center font-sans selection:bg-[#C76E00]/20">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-[#C76E00]/5 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-orange-200/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
            </div>

            <div className="relative z-10 max-w-xl animate-in fade-in zoom-in duration-700">
                {/* Visual Icon/Illustration */}
                <div className="relative mb-12">
                    <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center mx-auto border border-orange-100/50 backdrop-blur-sm relative z-10">
                        <UtensilsCrossed className="w-16 h-16 text-[#C76E00] stroke-[1.5]" />
                    </div>
                    {/* Shadow/Glow under icon */}
                    <div className="absolute left-1/2 -bottom-4 -translate-x-1/2 w-24 h-4 bg-black/5 rounded-full blur-md"></div>
                    
                    {/* Floating elements */}
                    <div className="absolute -top-4 -right-4 w-auto h-12 bg-orange-100 rounded-2xl flex items-center justify-center animate-bounce duration-[3s] px-4">
                        <span className="text-xl font-black text-charcoal tracking-tighter uppercase italic">
                            Food<span className="text-[#C76E00]"> Delivery</span>
                        </span>
                    </div>
                    <div className="absolute -bottom-8 -left-4 w-14 h-14 bg-white shadow-xl rounded-2xl flex items-center justify-center animate-bounce duration-[4s] delay-300">
                        <span className="text-2xl">🍔</span>
                    </div>
                </div>

                <h1 className="text-8xl font-black text-[#C76E00] italic tracking-tighter mb-4">404</h1>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">Oops! Trang bạn tìm không tồn tại</h2>
                
                <p className="text-gray-500 font-bold leading-relaxed mb-10 max-w-md mx-auto italic">
                    Có vẻ như món ngon bạn đang tìm kiếm đã được giao cho người khác hoặc địa chỉ này không còn tồn tại trên bản đồ GrabFood.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button 
                        onClick={() => navigate(-1)} 
                        variant="outline" 
                        className="w-full sm:w-auto px-8 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] border-orange-200 text-[#C76E00] hover:bg-orange-50 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                    </Button>
                    <Button 
                        onClick={() => navigate('/')} 
                        className="w-full sm:w-auto px-10 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-[#C76E00] hover:bg-[#A55B00] shadow-xl shadow-orange-200/50 text-white transition-all active:scale-95 border-b-4 border-[#8B4D00] flex items-center gap-2"
                    >
                        <Home className="w-4 h-4" />
                        Về trang chủ
                    </Button>
                </div>

                {/* Search Suggestion */}
                <div className="mt-16 flex items-center justify-center gap-2 text-gray-400 group cursor-pointer" onClick={() => navigate('/')}>
                    <Search className="w-4 h-4 group-hover:text-[#C76E00] transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-[#C76E00] transition-colors">Khám phá các món ăn khác</span>
                </div>
            </div>
        </div>
    );
}
