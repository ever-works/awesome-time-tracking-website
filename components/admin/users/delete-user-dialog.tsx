'use client';

import { UserData } from '@/lib/types/user';
import { Button } from '@/components/ui/button';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter 
} from '@/components/ui/modal';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteUserDialogProps {
  user: UserData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function DeleteUserDialog({ 
  user, 
  open, 
  onOpenChange, 
  onConfirm 
}: DeleteUserDialogProps) {
  return (
    <Modal 
      isOpen={open} 
      onClose={() => onOpenChange(false)}
      size="md"
    >
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold">Delete User</h2>
          </div>
        </ModalHeader>
        
        <ModalBody>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete <strong>{user.name}</strong> (@{user.username})? 
            This action cannot be undone.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                {user.name?.split(' ').map(n => n[0]).filter(Boolean).join('').toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-600">@{user.username} • {user.email}</p>
                {user.title && (
                  <p className="text-xs text-gray-500">{user.title}</p>
                )}
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={onConfirm}
              className="flex items-center gap-2 flex-1"
            >
              <Trash2 className="h-4 w-4" />
              Delete User
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 