import './notification.css';

const NotificationManager = {
  success: (message, duration = 3000) => {
    const notification = document.createElement('div');
    notification.className = 'custom-notification success';
    notification.innerHTML = `
      <div class="notification-content">
        <i class="ri-check-line notification-icon"></i>
        <span class="notification-message">${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animation in
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    // Animation out and remove
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  },

  error: (message, duration = 4000) => {
    const notification = document.createElement('div');
    notification.className = 'custom-notification error';
    notification.innerHTML = `
      <div class="notification-content">
        <i class="ri-error-warning-line notification-icon"></i>
        <span class="notification-message">${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  },

  warning: (message, duration = 3500) => {
    const notification = document.createElement('div');
    notification.className = 'custom-notification warning';
    notification.innerHTML = `
      <div class="notification-content">
        <i class="ri-alert-line notification-icon"></i>
        <span class="notification-message">${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  },

  info: (message, duration = 3000) => {
    const notification = document.createElement('div');
    notification.className = 'custom-notification info';
    notification.innerHTML = `
      <div class="notification-content">
        <i class="ri-information-line notification-icon"></i>
        <span class="notification-message">${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  },

  confirm: (message, onConfirm, onCancel) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirmation-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'confirmation-modal';
    modal.innerHTML = `
      <div class="confirmation-content">
        <div class="confirmation-header">
          <i class="ri-question-line confirmation-icon"></i>
          <h4>Xác nhận</h4>
        </div>
        <p class="confirmation-message">${message}</p>
        <div class="confirmation-actions">
          <button class="btn-cancel">Hủy</button>
          <button class="btn-confirm">Xác nhận</button>
        </div>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Add event listeners
    const cancelBtn = modal.querySelector('.btn-cancel');
    const confirmBtn = modal.querySelector('.btn-confirm');
    
    const closeModal = () => {
      overlay.classList.remove('show');
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    };
    
    cancelBtn.addEventListener('click', () => {
      closeModal();
      if (onCancel) onCancel();
    });
    
    confirmBtn.addEventListener('click', () => {
      closeModal();
      if (onConfirm) onConfirm();
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
        if (onCancel) onCancel();
      }
    });
    
    // Show modal
    setTimeout(() => {
      overlay.classList.add('show');
    }, 100);
  }
};

export default NotificationManager;