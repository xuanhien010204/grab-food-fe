import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        const variants = {
            default: 'border-transparent bg-orange-500 text-white hover:bg-orange-600',
            secondary: 'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200',
            outline: 'text-gray-950 border-gray-200',
            destructive: 'border-transparent bg-red-500 text-white hover:bg-red-600',
            success: 'border-transparent bg-green-100 text-green-700 hover:bg-green-200',
            warning: 'border-transparent bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
            info: 'border-transparent bg-blue-100 text-blue-700 hover:bg-blue-200',
        };

        return (
            <div
                ref={ref}
                className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    variants[variant],
                    className
                )}
                {...props}
            />
        );
    }
);
Badge.displayName = 'Badge';

export { Badge };
