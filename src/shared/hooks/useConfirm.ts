import { useState, useCallback } from "react";

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title,
        message,
        onConfirm: () => {
          setState(null);
          resolve(true);
        },
      });
    });
  }, []);

  const cancel = useCallback(() => {
    setState(null);
  }, []);

  return {
    confirm,
    cancel,
    confirmState: state,
  };
}
