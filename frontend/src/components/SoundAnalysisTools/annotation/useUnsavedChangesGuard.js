import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_MESSAGE = 'You have unsaved annotation changes. Leave this recording?';

const isModifiedClick = (event) => (
  event.metaKey
  || event.ctrlKey
  || event.shiftKey
  || event.altKey
  || event.button !== 0
);

const elementFromEvent = (event) => {
  const target = event.target;
  return target instanceof Element ? target : null;
};

/**
 * Guard leaving the annotation workspace with unsaved changes.
 *
 * Components can call requestLeave(action) for mode switches or replacing a
 * local file. Same-origin link clicks are intercepted while `when` is true.
 * The caller renders a dialog using isPromptOpen and confirmLeave/cancelLeave.
 */
export const useUnsavedChangesGuard = ({
  when = false,
  message = DEFAULT_MESSAGE,
} = {}) => {
  const [pendingAction, setPendingAction] = useState(null);
  const pendingRef = useRef(null);

  const setPending = useCallback((action) => {
    pendingRef.current = action;
    setPendingAction(() => action);
  }, []);

  const clearPending = useCallback(() => {
    pendingRef.current = null;
    setPendingAction(null);
  }, []);

  useEffect(() => {
    if (!when) {
      clearPending();
      return undefined;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [when, clearPending]);

  useEffect(() => {
    if (!when) return undefined;

    const handleInternalLink = (event) => {
      if (event.defaultPrevented || isModifiedClick(event)) return;

      const anchor = elementFromEvent(event)?.closest?.('a[href]');
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      let url;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (url.href === window.location.href) return;
      if (url.hash && url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setPending(() => {
        window.location.assign(url.href);
      });
    };

    document.addEventListener('click', handleInternalLink, true);
    return () => document.removeEventListener('click', handleInternalLink, true);
  }, [when, setPending]);

  const requestLeave = useCallback((action) => {
    if (!when) {
      if (typeof action === 'function') action();
      return true;
    }
    if (typeof action !== 'function') return false;
    setPending(action);
    return false;
  }, [when, setPending]);

  const confirmLeave = useCallback(() => {
    const action = pendingRef.current;
    clearPending();
    if (typeof action === 'function') action();
  }, [clearPending]);

  const cancelLeave = useCallback(() => {
    clearPending();
  }, [clearPending]);

  return {
    isPromptOpen: Boolean(pendingAction),
    message,
    requestLeave,
    confirmLeave,
    cancelLeave,
  };
};

export default useUnsavedChangesGuard;
