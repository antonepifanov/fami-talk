import { useEffect, useRef } from 'react';

export function useNotifications() {
  const permissionGranted = useRef(false);

  // Запрашиваем разрешение при загрузке
  useEffect(() => {
    if ('Notification' in window && !permissionGranted.current) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          permissionGranted.current = true;
          console.log('✅ Уведомления разрешены');
        }
      });
    }
  }, []);

  const showNotification = (title: string, body: string, onClick?: () => void) => {
    if (!permissionGranted.current) return;
    if (document.hidden === false) return; // не показываем, если вкладка активна

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      silent: false,
    });

    if (onClick) {
      notification.onclick = () => {
        notification.close();
        onClick();
      };
    }
  };

  return { showNotification };
}
