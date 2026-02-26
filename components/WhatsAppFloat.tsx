"use client";

export default function WhatsAppFloat() {
  // Replace with hotel WhatsApp number (international format, no +)
  const phone = "2348012345678";
  const message = encodeURIComponent("Hi, I need help with a booking.");

  const href = `https://wa.me/${phone}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed z-[60] right-5 bottom-5 md:right-7 md:bottom-7 w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
      style={{ backgroundColor: "#25D366" }}
    >
      {/* simple WhatsApp glyph */}
      <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path
          fill="white"
          d="M19.11 17.61c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.6.07-.27-.14-1.16-.43-2.21-1.37-.82-.73-1.37-1.64-1.53-1.91-.16-.27-.02-.42.12-.56.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.48-.84-2.03-.22-.53-.44-.46-.61-.47h-.52c-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.27s.98 2.64 1.12 2.82c.14.18 1.93 2.95 4.68 4.13.65.28 1.16.45 1.56.58.65.21 1.24.18 1.71.11.52-.08 1.6-.66 1.83-1.3.23-.64.23-1.18.16-1.3-.07-.11-.25-.18-.52-.32Z"
        />
        <path
          fill="white"
          d="M16.03 3C8.84 3 3 8.78 3 15.9c0 2.29.62 4.43 1.7 6.29L3.6 29l6.98-1.82a13.18 13.18 0 0 0 5.45 1.17c7.19 0 13.03-5.78 13.03-12.9S23.22 3 16.03 3Zm0 23.03c-1.72 0-3.33-.46-4.72-1.27l-.34-.2-4.14 1.08 1.09-4.02-.22-.35a10.93 10.93 0 0 1-1.65-5.77c0-6.03 4.97-10.94 11.08-10.94 6.11 0 11.08 4.91 11.08 10.94 0 6.03-4.97 10.53-11.18 10.53Z"
        />
      </svg>
    </a>
  );
}