import { copyToClipboard } from '@/lib/common';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import { Button } from 'react-daisyui';
import { toast } from 'react-hot-toast';
import { useState } from 'react';

interface CopyToClipboardProps {
  value: string | (() => Promise<string>);
  onCopy?: () => void;
  onError?: (error: Error) => void;
}

const CopyToClipboardButton = ({ value, onCopy, onError }: CopyToClipboardProps) => {
  const { t } = useTranslation('common');
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = async () => {
    try {
      setIsLoading(true);
      const actualValue = typeof value === 'function' ? await value() : value;
      copyToClipboard(actualValue);
      toast.success(t('copied-to-clipboard'));
      onCopy?.();
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error(t('failed-to-copy'));
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="link"
      size="xs"
      className="tooltip p-0"
      data-tip={t('copy-to-clipboard')}
      onClick={handleCopy}
      disabled={isLoading}
    >
      <ClipboardDocumentIcon className="w-5 h-5 text-secondary" />
    </Button>
  );
};

export default CopyToClipboardButton;
