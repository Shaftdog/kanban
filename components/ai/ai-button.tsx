'use client';

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AIButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function AIButton({ onClick, disabled }: AIButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          disabled={disabled}
          variant="default"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          AI Prioritize
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Get AI-powered task prioritization and suggestions</p>
      </TooltipContent>
    </Tooltip>
  );
}
