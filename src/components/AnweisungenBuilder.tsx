import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Anweisung } from '@/types/auftrag';
import * as LucideIcons from 'lucide-react';

interface AnweisungenBuilderProps {
  anweisungen: Anweisung[];
  onChange: (anweisungen: Anweisung[]) => void;
}

const popularIcons = [
  'Smartphone',
  'Search',
  'RefreshCw',
  'Settings',
  'Users',
  'Clock',
  'MapPin',
  'Camera',
  'Mic',
  'Bell',
  'Share',
  'Download',
  'Upload',
  'Edit',
  'Save',
  'FileText',
  'Image',
  'Video',
  'Music',
  'Calendar',
  'Mail',
  'MessageCircle',
  'Phone',
  'Wifi',
  'Bluetooth',
  'Battery',
  'Volume2',
  'Play',
  'Pause',
  'Stop',
  'SkipForward',
  'SkipBack',
  'Repeat',
  'Shuffle',
  'Home',
  'User',
  'Heart',
  'Star',
  'Flag',
  'Bookmark',
  'Filter',
  'Sort',
  'Grid',
  'List',
  'Eye',
  'EyeOff',
  'Lock',
  'Unlock',
  'Shield',
  'Key',
  'Zap',
  'Wifi',
  'Globe',
  'Monitor',
  'Tablet',
  'Watch',
  'Headphones'
];

const AnweisungenBuilder = ({ anweisungen, onChange }: AnweisungenBuilderProps) => {
  const [newAnweisung, setNewAnweisung] = useState<Partial<Anweisung>>({
    title: '',
    content: '',
    icon: '',
  });

  const addAnweisung = () => {
    if (newAnweisung.title && newAnweisung.content) {
      const anweisung: Anweisung = {
        id: crypto.randomUUID(),
        title: newAnweisung.title,
        content: newAnweisung.content,
        icon: newAnweisung.icon || undefined,
      };
      onChange([...anweisungen, anweisung]);
      setNewAnweisung({ title: '', content: '', icon: '' });
    }
  };

  const removeAnweisung = (id: string) => {
    onChange(anweisungen.filter(a => a.id !== id));
  };

  const updateAnweisung = (id: string, updates: Partial<Anweisung>) => {
    onChange(anweisungen.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const moveAnweisung = (fromIndex: number, toIndex: number) => {
    const updated = [...anweisungen];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onChange(updated);
  };

  const renderIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className="h-4 w-4" />;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Anweisungen verwalten</h3>
        
        {/* Existing Anweisungen */}
        <div className="space-y-3 mb-6">
          {anweisungen.map((anweisung, index) => (
            <Card key={anweisung.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="cursor-move mt-2">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      {renderIcon(anweisung.icon)}
                      <Input
                        value={anweisung.title}
                        onChange={(e) => updateAnweisung(anweisung.id, { title: e.target.value })}
                        placeholder="Anweisungstitel"
                        className="font-medium"
                      />
                    </div>
                    <Textarea
                      value={anweisung.content}
                      onChange={(e) => updateAnweisung(anweisung.id, { content: e.target.value })}
                      placeholder="Anweisungsinhalt"
                      rows={2}
                    />
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Icon:</Label>
                      <Select
                        value={anweisung.icon || ''}
                        onValueChange={(value) => updateAnweisung(anweisung.id, { icon: value || undefined })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Icon wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Kein Icon</SelectItem>
                          {popularIcons.map((icon) => (
                            <SelectItem key={icon} value={icon}>
                              <div className="flex items-center gap-2">
                                {renderIcon(icon)}
                                <span>{icon}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeAnweisung(anweisung.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add New Anweisung */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Neue Anweisung hinzufügen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-title">Titel</Label>
              <Input
                id="new-title"
                value={newAnweisung.title}
                onChange={(e) => setNewAnweisung(prev => ({ ...prev, title: e.target.value }))}
                placeholder="z.B. App-Setup:"
              />
            </div>
            
            <div>
              <Label htmlFor="new-content">Inhalt</Label>
              <Textarea
                id="new-content"
                value={newAnweisung.content}
                onChange={(e) => setNewAnweisung(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Beschreibung der Anweisung..."
                rows={3}
              />
            </div>

            <div>
              <Label>Icon (optional)</Label>
              <Select
                value={newAnweisung.icon || ''}
                onValueChange={(value) => setNewAnweisung(prev => ({ ...prev, icon: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Icon wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Kein Icon</SelectItem>
                  {popularIcons.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <div className="flex items-center gap-2">
                        {renderIcon(icon)}
                        <span>{icon}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={addAnweisung}
              disabled={!newAnweisung.title || !newAnweisung.content}
              className="bg-orange hover:bg-orange-dark"
            >
              <Plus className="h-4 w-4 mr-2" />
              Anweisung hinzufügen
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnweisungenBuilder;
