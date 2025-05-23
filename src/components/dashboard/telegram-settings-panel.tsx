
// src/components/dashboard/telegram-settings-panel.tsx
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShieldCheck, ShieldX, Loader2, HelpCircle, Eye, EyeOff, Send, CheckCircle2 } from 'lucide-react';

type ValidationStatus = 'pending' | 'valid' | 'invalid' | 'not_checked';

interface TelegramSettingsPanelProps {
  tokenValue: string;
  chatIdValue: string;
  onTokenChange: (value: string) => void;
  onChatIdChange: (value: string) => void;
  onValidateToken: () => Promise<void>;
  onValidateChatId: () => Promise<void>;
  tokenValidationStatus: ValidationStatus;
  chatIdValidationStatus: ValidationStatus;
  isLoadingToken: boolean;
  isLoadingChatId: boolean;
}

const ValidationIcon = ({ status, isLoading }: { status: ValidationStatus; isLoading?: boolean }) => {
  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }
  switch (status) {
    case 'pending':
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    case 'valid':
      return <ShieldCheck className="h-4 w-4 text-green-600" />;
    case 'invalid':
      return <ShieldX className="h-4 w-4 text-destructive" />;
    case 'not_checked':
    default:
      return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

export function TelegramSettingsPanel({
  tokenValue,
  chatIdValue,
  onTokenChange,
  onChatIdChange,
  onValidateToken,
  onValidateChatId,
  tokenValidationStatus,
  chatIdValidationStatus,
  isLoadingToken,
  isLoadingChatId,
}: TelegramSettingsPanelProps) {
  const [showToken, setShowToken] = React.useState(false);

  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <Label htmlFor="telegram-bot-token" className="text-base font-medium">
        Telegram Bot Ayarları
      </Label>
      <div className="space-y-2">
        <div className="relative">
          <Input
            id="telegram-bot-token"
            type={showToken ? 'text' : 'password'}
            value={tokenValue}
            onChange={(e) => onTokenChange(e.target.value)}
            placeholder="Bot Token"
            className="pr-10"
            aria-label="Telegram Bot Token"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
            onClick={() => setShowToken(!showToken)}
            aria-label={showToken ? 'Tokenı Gizle' : 'Tokenı Göster'}
          >
            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <Button
            onClick={onValidateToken}
            disabled={isLoadingToken || !tokenValue}
            className="w-full sm:w-auto"
          >
            {isLoadingToken && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Token Doğrula
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-2">
                  <ValidationIcon status={tokenValidationStatus} isLoading={isLoadingToken} />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {tokenValidationStatus === 'pending' ? 'Doğrulanıyor...' :
                   tokenValidationStatus === 'valid' ? 'Telegram token geçerli.' :
                   tokenValidationStatus === 'invalid' ? 'Telegram token geçersiz.' :
                   'Token henüz kontrol edilmedi.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="space-y-2">
        <Input
          id="telegram-chat-id"
          type="text"
          value={chatIdValue}
          onChange={(e) => onChatIdChange(e.target.value)}
          placeholder="Chat ID (Kullanıcı, grup veya kanal ID)"
          aria-label="Telegram Chat ID"
        />
        <div className="flex items-center justify-between">
          <Button
            onClick={onValidateChatId}
            disabled={isLoadingChatId || !chatIdValue || tokenValidationStatus !== 'valid'}
            className="w-full sm:w-auto"
          >
            {isLoadingChatId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Chat ID Doğrula & Test Et
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-2">
                  <ValidationIcon status={chatIdValidationStatus} isLoading={isLoadingChatId} />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {chatIdValidationStatus === 'pending' ? 'Doğrulanıyor...' :
                   chatIdValidationStatus === 'valid' ? 'Telegram Chat ID geçerli ve test mesajı gönderildi.' :
                   chatIdValidationStatus === 'invalid' ? 'Telegram Chat ID geçersiz veya mesaj gönderilemedi.' :
                   'Chat ID henüz kontrol edilmedi. (Önce tokenı doğrulayın)'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
         {tokenValidationStatus !== 'valid' && (
            <p className="text-xs text-muted-foreground">Chat ID'yi doğrulamadan önce geçerli bir bot token girip doğrulamanız gerekmektedir.</p>
        )}
      </div>
    </div>
  );
}
