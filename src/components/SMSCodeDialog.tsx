
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Loader } from 'lucide-react';

interface SMSCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (code: string) => Promise<void>;
  isLoading: boolean;
  phone?: string;
}

const SMSCodeDialog = ({ open, onOpenChange, onSubmit, isLoading, phone }: SMSCodeDialogProps) => {
  const [smsCode, setSmsCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsCode.trim()) return;
    
    await onSubmit(smsCode.trim());
    setSmsCode('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setSmsCode('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            SMS Code eingeben
          </DialogTitle>
          <DialogDescription>
            Geben Sie den SMS Code ein, den Sie für die Nummer {phone} erhalten haben.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="smsCode" className="text-right">
                SMS Code
              </Label>
              <Input
                id="smsCode"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                placeholder="z.B. 123456"
                className="col-span-3"
                disabled={isLoading}
                autoFocus
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !smsCode.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 mr-1 animate-spin" />
                  Sende...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Code senden
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SMSCodeDialog;
