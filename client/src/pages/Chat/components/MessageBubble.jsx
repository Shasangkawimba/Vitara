// ============================================================
// client/src/pages/Chat/components/MessageBubble.jsx
// Bubble pesan user pada halaman Chat.
// ============================================================
import React from "react";

const MessageBubble = ({ teks, waktu }) => {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed text-white whitespace-pre-wrap break-words">
            {teks}
          </p>
        </div>
        {waktu && (
          <div className="flex items-center justify-end gap-1 mt-1 pr-1">
            <span className="text-[10px] text-text-soft">{waktu}</span>
            <span className="material-symbols-outlined text-primary text-[14px]">
              done_all
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
