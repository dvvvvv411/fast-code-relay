
import { useState } from 'react';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useUsers, type User as UserType } from '@/hooks/useUsers';

interface UserSelectProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  placeholder?: string;
}

const UserSelect = ({ value, onValueChange, placeholder = "Benutzer auswählen..." }: UserSelectProps) => {
  const [open, setOpen] = useState(false);
  const { data: users = [], isLoading } = useUsers();

  const selectedUser = users.find(user => user.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{selectedUser.display_name}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Benutzer suchen..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Lade Benutzer..." : "Keine Benutzer gefunden."}
            </CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.display_name}
                  onSelect={() => {
                    onValueChange(user.id === value ? undefined : user.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <User className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{user.display_name}</span>
                    {user.email && (
                      <span className="text-xs text-gray-500">{user.email}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default UserSelect;
