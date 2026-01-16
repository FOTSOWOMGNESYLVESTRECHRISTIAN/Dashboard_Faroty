import React from 'react';
import { Button } from "./button";
import { MoreHorizontal, Trash2, Pause, X, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export type Status = 'active' | 'suspended' | 'cancelled' | 'deleted' | 'inactive' | 'pending';

export interface ActionMenuProps {
  status: Status;
  onSuspend?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onActivate?: () => void;
  onEdit?: () => void;
  itemType?: 'application' | 'account' | 'wallet';
  className?: string;
  disabled?: boolean;
}

export function ActionMenu({
  status,
  onSuspend,
  onCancel,
  onDelete,
  onActivate,
  onEdit,
  itemType = 'application',
  className = '',
  disabled = false
}: ActionMenuProps) {
  const getItemName = () => {
    switch (itemType) {
      case 'account':
        return 'ce compte';
      case 'wallet':
        return 'ce portefeuille';
      default:
        return 'cette application';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`h-8 w-8 p-0 ${className}`}
          disabled={disabled}
        >
          <span className="sr-only">Ouvrir le menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {onEdit && (
          <DropdownMenuItem onSelect={onEdit}>
            <Pause className="mr-2 h-4 w-4" />
            Modifier
          </DropdownMenuItem>
        )}
        {status === 'active' && onSuspend && (
          <DropdownMenuItem onSelect={onSuspend} className="text-amber-600">
            <Pause className="mr-2 h-4 w-4" />
            Suspendre
          </DropdownMenuItem>
        )}
        {status === 'suspended' && onActivate && (
          <DropdownMenuItem onSelect={onActivate} className="text-green-600">
            <Check className="mr-2 h-4 w-4" />
            Activer
          </DropdownMenuItem>
        )}
        {status === 'cancelled' && onActivate && (
          <DropdownMenuItem onSelect={onActivate} className="text-green-600">
            <Check className="mr-2 h-4 w-4" />
            Réactiver
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            onSelect={onDelete}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
