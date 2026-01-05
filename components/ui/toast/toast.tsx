import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  title?: string;
  description: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'bg-white border-l-4 border-green-500 text-gray-800 shadow-lg',
  error: 'bg-white border-l-4 border-red-500 text-gray-800 shadow-lg',
  warning: 'bg-white border-l-4 border-yellow-500 text-gray-800 shadow-lg',
  info: 'bg-white border-l-4 border-blue-500 text-gray-800 shadow-lg',
};

export function Toast({
  id,
  title,
  description,
  type = 'info',
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = icons[type];

  useEffect(() => {
    // Animation frame to ensure transition plays
    requestAnimationFrame(() => setIsVisible(true));

    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full transform items-start gap-3 rounded-md p-4 transition-all duration-300 ease-in-out",
        styles[type],
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
      role="alert"
    >
      <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", 
        type === 'success' && "text-green-500",
        type === 'error' && "text-red-500",
        type === 'warning' && "text-yellow-500",
        type === 'info' && "text-blue-500"
      )} />
      
      <div className="flex-1">
        {title && <h3 className="font-medium text-sm mb-1">{title}</h3>}
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
      </div>

      <button
        onClick={handleClose}
        className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
