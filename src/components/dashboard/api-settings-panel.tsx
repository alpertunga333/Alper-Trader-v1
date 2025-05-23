
// src/components/dashboard/api-settings-panel.tsx
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShieldCheck, ShieldX, Loader2, HelpCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import type { ApiEnvironment } from '@/ai/types/strategy-types';
import { cn } from '@/lib/utils';

type ValidationStatus = 'pending' | 'valid' | 'invalid' | 'not_checked';

interface ApiKeySettingsPanelProps {
  environmentTag: ApiEnvironment;
  label: string;
  apiKeyValue: string;
  secretKeyValue: string;
  onApiKeyChange: (value: string) => void;
  onSecretKeyChange: (value: string) => void;
  onValidate: () => Promise<void>;
  validationStatus: ValidationStatus;
  isLoading: boolean;
  isActive: boolean;
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

export function ApiKeySettingsPanel({
  environmentTag,
  label,
  apiKeyValue,
  secretKeyValue,
  onApiKeyChange,
  onSecretKeyChange,
  onValidate,
  validationStatus,
  isLoading,
  isActive,
}: ApiKeySettingsPanelProps) {
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [showSecretKey, setShowSecretKey] = React.useState(false);

  return (
    <div className={cn("space-y-3 p-4 border rounded-lg", isActive && "ring-2 ring-primary shadow-md bg-primary/5")}>
      <div className="flex items-center justify-between">
        <Label htmlFor={`api-key-${environmentTag}`} className="text-base font-medium">
          {label}
        </Label>
        {isActive && (
          <span className="flex items-center text-xs font-medium text-primary px-2 py-0.5 rounded-full bg-primary/10">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aktif Ortam
          </span>
        )}
      </div>
      <div className="space-y-2">
        <div className="relative">
          <Input
            id={`api-key-${environmentTag}`}
            type={showApiKey ? 'text' : 'password'}
            value={apiKeyValue}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="API Anahtarı"
            className="pr-10"
            aria-label={`${label} API Anahtarı`}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
            onClick={() => setShowApiKey(!showApiKey)}
            aria-label={showApiKey ? 'API Anahtarını Gizle' : 'API Anahtarını Göster'}
          >
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <div className="relative">
          <Input
            id={`secret-key-${environmentTag}`}
            type={showSecretKey ? 'text' : 'password'}
            value={secretKeyValue}
            onChange={(e) => onSecretKeyChange(e.target.value)}
            placeholder="Gizli Anahtar"
            className="pr-10"
            aria-label={`${label} Gizli Anahtar`}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
            onClick={() => setShowSecretKey(!showSecretKey)}
            aria-label={showSecretKey ? 'Gizli Anahtarı Gizle' : 'Gizli Anahtarı Göster'}
          >
            {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Button onClick={onValidate} disabled={isLoading || !apiKeyValue || !secretKeyValue} className="w-full sm:w-auto">
          {isLoading && validationStatus === 'pending' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Doğrula & Aktif Et
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="ml-2">
                <ValidationIcon status={validationStatus} isLoading={isLoading && validationStatus === 'pending'} />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {validationStatus === 'pending' ? 'Doğrulanıyor...' :
                 validationStatus === 'valid' ? 'API anahtarları geçerli ve bu ortam aktif.' :
                 validationStatus === 'invalid' ? 'API anahtarları geçersiz.' :
                 'API anahtarları henüz kontrol edilmedi.'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
