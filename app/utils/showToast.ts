import { toast } from "sonner";

interface ToastOptions {
  status: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export function showToast({ status, message }: ToastOptions) {
  switch(status) {
    case 'success':
      toast.success(message);
      break;
    case 'error':
      toast.error(message);
      break;
    case 'info':
      toast.info(message);
      break;
    case 'warning':
      toast.warning(message);
      break;
  }
}