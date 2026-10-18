interface Props {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Да',
  cancelLabel = 'Нет',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-900 border-4 border-amber-500 p-6 max-w-md w-full text-center shadow-2xl">
        <h2 className="text-amber-400 mb-4 px-text-glow-gold" style={{ fontSize: '14px' }}>
          {title}
        </h2>
        {message && (
          <p className="text-gray-300 mb-6" style={{ fontSize: '10px', lineHeight: '1.8' }}>
            {message}
          </p>
        )}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onConfirm}
            className="px-btn bg-red-800 border-red-400 text-red-100 px-6 py-3 hover:bg-red-700"
            style={{ fontSize: '11px' }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="px-btn bg-green-800 border-green-400 text-green-100 px-6 py-3 hover:bg-green-700"
            style={{ fontSize: '11px' }}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
