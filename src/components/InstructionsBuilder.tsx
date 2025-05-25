
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, MoveUp, MoveDown } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Instruction {
  id: string;
  title: string;
  content: string;
  icon?: string;
}

interface InstructionsBuilderProps {
  instructions: Instruction[];
  onChange: (instructions: Instruction[]) => void;
}

const availableIcons = [
  { value: 'smartphone', label: 'Smartphone' },
  { value: 'search', label: 'Suche' },
  { value: 'refresh-ccw', label: 'Synchronisation' },
  { value: 'arrow-down', label: 'Pfeil nach unten' },
  { value: 'arrow-up', label: 'Pfeil nach oben' },
  { value: '', label: 'Kein Icon' }
];

const InstructionsBuilder = ({ instructions, onChange }: InstructionsBuilderProps) => {
  const [newInstruction, setNewInstruction] = useState<Instruction>({
    id: '',
    title: '',
    content: '',
    icon: ''
  });

  const addInstruction = () => {
    if (!newInstruction.title.trim() || !newInstruction.content.trim()) return;
    
    const instruction = {
      ...newInstruction,
      id: Date.now().toString()
    };
    
    onChange([...instructions, instruction]);
    setNewInstruction({ id: '', title: '', content: '', icon: '' });
  };

  const removeInstruction = (id: string) => {
    onChange(instructions.filter(inst => inst.id !== id));
  };

  const updateInstruction = (id: string, field: keyof Instruction, value: string) => {
    onChange(instructions.map(inst => 
      inst.id === id ? { ...inst, [field]: value } : inst
    ));
  };

  const moveInstruction = (id: string, direction: 'up' | 'down') => {
    const index = instructions.findIndex(inst => inst.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= instructions.length) return;
    
    const newInstructions = [...instructions];
    [newInstructions[index], newInstructions[newIndex]] = [newInstructions[newIndex], newInstructions[index]];
    onChange(newInstructions);
  };

  return (
    <div className="space-y-4">
      {instructions.map((instruction, index) => (
        <Card key={instruction.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex justify-between items-center">
              <span>Anweisung {index + 1}</span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveInstruction(instruction.id, 'up')}
                  disabled={index === 0}
                >
                  <MoveUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveInstruction(instruction.id, 'down')}
                  disabled={index === instructions.length - 1}
                >
                  <MoveDown className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeInstruction(instruction.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Titel</Label>
                <Input
                  value={instruction.title}
                  onChange={(e) => updateInstruction(instruction.id, 'title', e.target.value)}
                  placeholder="z.B. App-Setup"
                />
              </div>
              <div>
                <Label>Icon</Label>
                <Select
                  value={instruction.icon}
                  onValueChange={(value) => updateInstruction(instruction.id, 'icon', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Icon auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIcons.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        {icon.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Inhalt</Label>
              <Textarea
                value={instruction.content}
                onChange={(e) => updateInstruction(instruction.id, 'content', e.target.value)}
                placeholder="Beschreibung der Anweisung..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Neue Anweisung hinzufügen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Titel</Label>
              <Input
                value={newInstruction.title}
                onChange={(e) => setNewInstruction({ ...newInstruction, title: e.target.value })}
                placeholder="z.B. App-Setup"
              />
            </div>
            <div>
              <Label>Icon</Label>
              <Select
                value={newInstruction.icon}
                onValueChange={(value) => setNewInstruction({ ...newInstruction, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Icon auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {availableIcons.map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      {icon.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectTrigger>
            </div>
          </div>
          <div>
            <Label>Inhalt</Label>
            <Textarea
              value={newInstruction.content}
              onChange={(e) => setNewInstruction({ ...newInstruction, content: e.target.value })}
              placeholder="Beschreibung der Anweisung..."
              rows={3}
            />
          </div>
          <Button
            type="button"
            onClick={addInstruction}
            variant="outline"
            className="w-full"
            disabled={!newInstruction.title.trim() || !newInstruction.content.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Anweisung hinzufügen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructionsBuilder;
