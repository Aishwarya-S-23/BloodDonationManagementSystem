import { useDispatch, useSelector } from 'react-redux';
import { closeModal } from '../../store/slices/uiSlice';

const ConfirmationModal = () => {
  const { modal } = useSelector((state) => state.ui);
  const dispatch = useDispatch();

  if (!modal.open) return null;

  const handleConfirm = () => {
    if (modal.data?.onConfirm) {
      modal.data.onConfirm();
    }
    dispatch(closeModal());
  };

  const handleCancel = () => {
    if (modal.data?.onCancel) {
      modal.data.onCancel();
    }
    dispatch(closeModal());
  };

  const getModalContent = () => {
    switch (modal.type) {
      case 'cancelRequest':
        return {
          title: 'Cancel Blood Request',
          message: 'Are you sure you want to cancel this blood request? This action cannot be undone.',
          confirmText: 'Cancel Request',
          confirmColor: 'bg-danger-600 hover:bg-danger-700',
        };
      case 'delete':
        return {
          title: 'Confirm Deletion',
          message: 'Are you sure you want to delete this item? This action cannot be undone.',
          confirmText: 'Delete',
          confirmColor: 'bg-danger-600 hover:bg-danger-700',
        };
      default:
        return {
          title: 'Confirm Action',
          message: modal.data?.message || 'Are you sure you want to proceed?',
          confirmText: 'Confirm',
          confirmColor: 'bg-primary-600 hover:bg-primary-700',
        };
    }
  };

  const content = getModalContent();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleCancel}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {content.title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{content.message}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${content.confirmColor} text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm`}
              onClick={handleConfirm}
            >
              {content.confirmText}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

