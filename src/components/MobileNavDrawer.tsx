import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  /** Optional top offset class when docked beneath a sticky header (e.g. 'top-16 sm:top-[78px]') */
  topOffsetClass?: string;
  /** Optional breakpoint visibility class (e.g. 'lg:hidden' for mobile-only drawer) */
  visibilityClass?: string;
  /** Hide built-in drawer header when an external morphing close trigger stays visible in the top bar */
  hideHeader?: boolean;
  /** Optional custom header slot rendered inside a narenj-tray card */
  headerSlot?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Reusable RTL Slide-out Navigation Drawer styled with the Narenj V3 'narenj-tray' aesthetic:
 * Warm cream paper (#f5f1e4) canvas hosting elevated white .narenj-tray grouped cards.
 */
export function MobileNavDrawer({
  open,
  onClose,
  title,
  subtitle,
  topOffsetClass = 'top-0',
  visibilityClass = '',
  hideHeader = false,
  headerSlot,
  children,
  footer,
}: MobileNavDrawerProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-x-0 ${topOffsetClass} bottom-0 z-50 flex ${visibilityClass} transition-opacity duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Dimmed Backdrop */}
      <div
        className={`fixed inset-x-0 ${topOffsetClass} bottom-0 bg-[#1d1d1b]/40 backdrop-blur-[2px]`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Cream Paper Sheet housing elevated white .narenj-tray cards */}
      <aside
        role="dialog"
        aria-modal={open ? 'true' : undefined}
        aria-label={title ?? 'منوی ناوبری'}
        className={`relative z-10 w-[320px] max-w-[86vw] h-full bg-[#f5f1e4] border-l border-[#e0dbce] shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          topOffsetClass === 'top-0' ? 'rounded-l-[28px]' : 'rounded-bl-[28px]'
        } ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Optional Header inside a crisp narenj-tray */}
        {!hideHeader && (
          <div className="p-4 pb-2 shrink-0">
            <div className="narenj-tray border border-[#e0dbce]/80 px-4 py-3 flex items-center justify-between gap-3">
              {headerSlot ? (
                <div className="min-w-0 flex-1">{headerSlot}</div>
              ) : (
                <div className="min-w-0 flex-1">
                  {title && (
                    <p className="text-sm font-bold text-[#1d1d1b] truncate">{title}</p>
                  )}
                  {subtitle && (
                    <p className="text-xs font-semibold text-[#686562] truncate mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="بستن منو"
                className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-[14px] bg-[#f5f1e4] hover:bg-[#ffe5d8] text-[#1d1d1b] hover:text-[#ff5c0c] inline-flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Tray Groups */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">{children}</div>

        {/* Sticky Footer Tray */}
        {footer && (
          <div className="p-4 pt-2 shrink-0">
            <div className="narenj-tray border border-[#e0dbce]/80 p-2 space-y-1">{footer}</div>
          </div>
        )}
      </aside>
    </div>
  );
}

interface DrawerTrayGroupProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Elevated white 'narenj-tray' card container for grouping related drawer links or controls.
 */
export function DrawerTrayGroup({ label, children, className = '' }: DrawerTrayGroupProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <p className="px-2 text-xs font-bold text-[#686562]">{label}</p>
      )}
      <div className="narenj-tray border border-[#e0dbce]/80 p-2 space-y-1">{children}</div>
    </div>
  );
}
