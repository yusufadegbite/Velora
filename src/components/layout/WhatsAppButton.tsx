import { site } from "@/lib/site";
import { whatsappLink } from "@/lib/utils";

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8.2 8.2 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.8.4 3.5 3.5 0 0 0-1.1 2.6 6 6 0 0 0 1.3 3.2 13.8 13.8 0 0 0 5.3 4.7c2 .8 2.7.9 3.7.8.6-.1 1.8-.8 2-1.5s.3-1.3.2-1.5-.3-.2-.6-.3zM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.3-.4a9.8 9.8 0 1 1 8.4 4.6zM20.5 3.5A11.8 11.8 0 0 0 2 17.7L.4 23.6l6-1.6a11.8 11.8 0 0 0 5.6 1.4A11.8 11.8 0 0 0 20.5 3.5z" />
    </svg>
  );
}

export function WhatsAppButton() {
  return (
    <a href={whatsappLink(site.whatsapp, "Hello VELORA, I'd like some help finding a vehicle.")} target="_blank" rel="noopener noreferrer" aria-label="Chat with VELORA on WhatsApp"
      className="fixed right-4 bottom-4 z-30 grid size-13 place-items-center rounded-full bg-[#1f9d55] text-white shadow-[0_12px_30px_-10px_rgba(31,157,85,0.8)] transition hover:scale-105 sm:right-6 sm:bottom-6">
      <WhatsAppIcon className="size-6" />
    </a>
  );
}
