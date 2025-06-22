import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Eye, UserPlus, Users, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import InstructionsBuilder from './InstructionsBuilder';
import EvaluationQuestionsBuilder from './EvaluationQuestionsBuilder';
import AssignmentDialog from './AssignmentDialog';
import AssignmentListDialog from './AssignmentListDialog';
import UserSelect from './UserSelect';

interface Auftrag {
  id: string;
  title: string;
  auftragsnummer: string;
  anbieter: string;
  projektziel: string;
  app_store_link: string | null;
  google_play_link: string | null;
  show_download_links: boolean;
  anweisungen: any[];
  kontakt_name: string;
  kontakt_email: string;
  created_at: string;
}

interface EvaluationQuestion {
  id: string;
  question_text: string;
  question_order: number;
}

const AuftraegeManager = () => {
  const [auftraege, setAuftraege] = useState<Auftrag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAuftrag, setEditingAuftrag] = useState<Auftrag | null>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [assignmentListDialogOpen, setAssignmentListDialogOpen] = useState(false);
  const [selectedAuftragForAssignment, setSelectedAuftragForAssignment] = useState<Auftrag | null>(null);
  const [selectedAuftragForList, setSelectedAuftragForList] = useState<Auftrag | null>(null);
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  const [userAssignDialogOpen, setUserAssignDialogOpen] = useState(false);
  const [selectedAuftragForUserAssign, setSelectedAuftragForUserAssign] = useState<Auftrag | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    auftragsnummer: '',
    anbieter: '',
    projektziel: '',
    app_store_link: '',
    google_play_link: '',
    show_download_links: true,
    anweisungen: [],
    evaluation_questions: [] as EvaluationQuestion[],
    kontakt_name: 'Friedrich Hautmann',
    kontakt_email: 'f.hautmann@sls-advisors.net'
  });

  useEffect(() => {
    fetchAuftraege();
    fetchAssignmentCounts();
  }, []);

  const fetchAuftraege = async () => {
    try {
      const { data, error } = await supabase
        .from('auftraege')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type cast the anweisungen field to ensure it's an array
      const typedData = (data || []).map(item => ({
        ...item,
        anweisungen: Array.isArray(item.anweisungen) ? item.anweisungen : []
      }));
      
      setAuftraege(typedData);
    } catch (error) {
      console.error('Error fetching auftraege:', error);
      toast({
        title: "Fehler",
        description: "Aufträge konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignmentCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('auftrag_assignments')
        .select('auftrag_id');

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach(assignment => {
        counts[assignment.auftrag_id] = (counts[assignment.auftrag_id] || 0) + 1;
      });
      
      setAssignments(counts);
    } catch (error) {
      console.error('Error fetching assignment counts:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      auftragsnummer: '',
      anbieter: '',
      projektziel: '',
      app_store_link: '',
      google_play_link: '',
      show_download_links: true,
      anweisungen: [],
      evaluation_questions: [],
      kontakt_name: 'Friedrich Hautmann',
      kontakt_email: 'f.hautmann@sls-advisors.net'
    });
    setEditingAuftrag(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Clean up empty string values to null for optional fields
      const cleanedData = {
        title: formData.title,
        auftragsnummer: formData.auftragsnummer,
        anbieter: formData.anbieter,
        projektziel: formData.projektziel,
        app_store_link: formData.app_store_link || null,
        google_play_link: formData.google_play_link || null,
        show_download_links: formData.show_download_links,
        anweisungen: formData.anweisungen,
        kontakt_name: formData.kontakt_name,
        kontakt_email: formData.kontakt_email
      };
      
      let auftragId: string;
      
      if (editingAuftrag) {
        const { error } = await supabase
          .from('auftraege')
          .update(cleanedData)
          .eq('id', editingAuftrag.id);
        
        if (error) throw error;
        auftragId = editingAuftrag.id;
        
        toast({
          title: "Erfolg",
          description: "Auftrag wurde aktualisiert."
        });
      } else {
        const { data, error } = await supabase
          .from('auftraege')
          .insert([cleanedData])
          .select()
          .single();
        
        if (error) throw error;
        auftragId = data.id;
        
        toast({
          title: "Erfolg",
          description: "Auftrag wurde erstellt."
        });
      }

      // Handle evaluation questions
      if (formData.evaluation_questions.length > 0) {
        // Delete existing questions if editing
        if (editingAuftrag) {
          await supabase
            .from('evaluation_questions')
            .delete()
            .eq('auftrag_id', auftragId);
        }

        // Insert new questions
        const questionsToInsert = formData.evaluation_questions.map(q => ({
          auftrag_id: auftragId,
          question_text: q.question_text,
          question_order: q.question_order
        }));

        const { error: questionsError } = await supabase
          .from('evaluation_questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchAuftraege();
    } catch (error) {
      console.error('Error saving auftrag:', error);
      toast({
        title: "Fehler",
        description: "Auftrag konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = async (auftrag: Auftrag) => {
    setEditingAuftrag(auftrag);
    
    // Fetch evaluation questions for this auftrag
    try {
      const { data: questionsData, error } = await supabase
        .from('evaluation_questions')
        .select('*')
        .eq('auftrag_id', auftrag.id)
        .order('question_order');

      if (error) throw error;

      setFormData({
        title: auftrag.title,
        auftragsnummer: auftrag.auftragsnummer,
        anbieter: auftrag.anbieter,
        projektziel: auftrag.projektziel,
        app_store_link: auftrag.app_store_link || '',
        google_play_link: auftrag.google_play_link || '',
        show_download_links: auftrag.show_download_links,
        anweisungen: Array.isArray(auftrag.anweisungen) ? auftrag.anweisungen : [],
        evaluation_questions: questionsData || [],
        kontakt_name: auftrag.kontakt_name,
        kontakt_email: auftrag.kontakt_email
      });
    } catch (error) {
      console.error('Error fetching evaluation questions:', error);
      setFormData({
        title: auftrag.title,
        auftragsnummer: auftrag.auftragsnummer,
        anbieter: auftrag.anbieter,
        projektziel: auftrag.projektziel,
        app_store_link: auftrag.app_store_link || '',
        google_play_link: auftrag.google_play_link || '',
        show_download_links: auftrag.show_download_links,
        anweisungen: Array.isArray(auftrag.anweisungen) ? auftrag.anweisungen : [],
        evaluation_questions: [],
        kontakt_name: auftrag.kontakt_name,
        kontakt_email: auftrag.kontakt_email
      });
    }
    
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Auftrag löschen möchten?')) return;
    
    try {
      const { error } = await supabase
        .from('auftraege')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Erfolg",
        description: "Auftrag wurde gelöscht."
      });
      
      fetchAuftraege();
      fetchAssignmentCounts();
    } catch (error) {
      console.error('Error deleting auftrag:', error);
      toast({
        title: "Fehler",
        description: "Auftrag konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  const handleViewAuftrag = (id: string) => {
    window.open(`/auftrag/${id}`, '_blank');
  };

  const handleAssignAuftrag = (auftrag: Auftrag) => {
    setSelectedAuftragForAssignment(auftrag);
    setAssignmentDialogOpen(true);
  };

  const handleViewAssignments = (auftrag: Auftrag) => {
    setSelectedAuftragForList(auftrag);
    setAssignmentListDialogOpen(true);
  };

  const handleAssignmentCreated = () => {
    fetchAssignmentCounts();
  };

  const handleUserAssign = (auftrag: Auftrag) => {
    setSelectedAuftragForUserAssign(auftrag);
    setSelectedUserId(undefined);
    setUserAssignDialogOpen(true);
  };

  const handleUserAssignSubmit = async () => {
    if (!selectedAuftragForUserAssign || !selectedUserId) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie einen Benutzer aus.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🎯 Assigning auftrag to user:', selectedAuftragForUserAssign.id, 'to user:', selectedUserId);
      
      const assignmentData = {
        auftrag_id: selectedAuftragForUserAssign.id,
        assigned_user_id: selectedUserId,
        worker_first_name: 'System',
        worker_last_name: 'Assignment',
        assignment_url: '' // Will be auto-generated
      };

      const { error } = await supabase
        .from('auftrag_assignments')
        .insert(assignmentData);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: `Auftrag wurde erfolgreich zugewiesen.`
      });

      setUserAssignDialogOpen(false);
      setSelectedAuftragForUserAssign(null);
      setSelectedUserId(undefined);
      fetchAssignmentCounts();
    } catch (error) {
      console.error('Error assigning auftrag to user:', error);
      toast({
        title: "Fehler",
        description: "Auftrag konnte nicht zugewiesen werden.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Lade Aufträge...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Aufträge verwalten</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-orange hover:bg-orange-dark">
              <Plus className="h-4 w-4 mr-2" />
              Neuen Auftrag erstellen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAuftrag ? 'Auftrag bearbeiten' : 'Neuen Auftrag erstellen'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Titel</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="auftragsnummer">Auftragsnummer</Label>
                  <Input
                    id="auftragsnummer"
                    value={formData.auftragsnummer}
                    onChange={(e) => setFormData({ ...formData, auftragsnummer: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="anbieter">Anbieter</Label>
                <Input
                  id="anbieter"
                  value={formData.anbieter}
                  onChange={(e) => setFormData({ ...formData, anbieter: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="projektziel">Projektziel</Label>
                <Textarea
                  id="projektziel"
                  value={formData.projektziel}
                  onChange={(e) => setFormData({ ...formData, projektziel: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show_download_links"
                  checked={formData.show_download_links}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_download_links: checked })}
                />
                <Label htmlFor="show_download_links">Download-Links anzeigen</Label>
              </div>

              {formData.show_download_links && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="app_store_link">App Store Link</Label>
                    <Input
                      id="app_store_link"
                      value={formData.app_store_link}
                      onChange={(e) => setFormData({ ...formData, app_store_link: e.target.value })}
                      placeholder="https://apps.apple.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="google_play_link">Google Play Link</Label>
                    <Input
                      id="google_play_link"
                      value={formData.google_play_link}
                      onChange={(e) => setFormData({ ...formData, google_play_link: e.target.value })}
                      placeholder="https://play.google.com/..."
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Anweisungen</Label>
                <InstructionsBuilder
                  instructions={formData.anweisungen}
                  onChange={(instructions) => setFormData({ ...formData, anweisungen: instructions })}
                />
              </div>

              <div>
                <EvaluationQuestionsBuilder
                  questions={formData.evaluation_questions}
                  onChange={(questions) => setFormData({ ...formData, evaluation_questions: questions })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kontakt_name">Kontakt Name</Label>
                  <Input
                    id="kontakt_name"
                    value={formData.kontakt_name}
                    onChange={(e) => setFormData({ ...formData, kontakt_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="kontakt_email">Kontakt E-Mail</Label>
                  <Input
                    id="kontakt_email"
                    type="email"
                    value={formData.kontakt_email}
                    onChange={(e) => setFormData({ ...formData, kontakt_email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-orange hover:bg-orange-dark">
                  {editingAuftrag ? 'Aktualisieren' : 'Erstellen'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Abbrechen
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {auftraege.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Noch keine Aufträge erstellt.</p>
            </CardContent>
          </Card>
        ) : (
          auftraege.map((auftrag) => (
            <Card key={auftrag.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{auftrag.title}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUserAssign(auftrag)}
                      className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      An Benutzer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssignAuftrag(auftrag)}
                      className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Zuweisen
                    </Button>
                    {assignments[auftrag.id] > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAssignments(auftrag)}
                        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 relative"
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Zuweisungen
                        <Badge 
                          variant="secondary" 
                          className="ml-2 bg-blue-100 text-blue-800 text-xs"
                        >
                          {assignments[auftrag.id]}
                        </Badge>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAuftrag(auftrag.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(auftrag)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(auftrag.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Auftragsnummer:</strong> {auftrag.auftragsnummer}
                  </div>
                  <div>
                    <strong>Anbieter:</strong> {auftrag.anbieter}
                  </div>
                  <div className="col-span-2">
                    <strong>Projektziel:</strong> {auftrag.projektziel.substring(0, 100)}...
                  </div>
                  <div>
                    <strong>Erstellt:</strong> {new Date(auftrag.created_at).toLocaleDateString('de-DE')}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Zuweisungen:</strong> 
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {assignments[auftrag.id] || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* User Assignment Dialog */}
      <Dialog open={userAssignDialogOpen} onOpenChange={setUserAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-purple-500" />
              Auftrag an Benutzer zuweisen
            </DialogTitle>
            {selectedAuftragForUserAssign && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>{selectedAuftragForUserAssign.title}</strong>
              </p>
            )}
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Benutzer auswählen</Label>
              <UserSelect
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                placeholder="Benutzer auswählen..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleUserAssignSubmit}
                className="bg-purple-600 hover:bg-purple-700 flex-1"
                disabled={!selectedUserId}
              >
                Zuweisen
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setUserAssignDialogOpen(false)}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      {selectedAuftragForAssignment && (
        <AssignmentDialog
          isOpen={assignmentDialogOpen}
          onClose={() => {
            setAssignmentDialogOpen(false);
            setSelectedAuftragForAssignment(null);
          }}
          auftragId={selectedAuftragForAssignment.id}
          auftragTitle={selectedAuftragForAssignment.title}
          onAssignmentCreated={handleAssignmentCreated}
        />
      )}

      {/* Assignment List Dialog */}
      {selectedAuftragForList && (
        <AssignmentListDialog
          isOpen={assignmentListDialogOpen}
          onClose={() => {
            setAssignmentListDialogOpen(false);
            setSelectedAuftragForList(null);
          }}
          auftragId={selectedAuftragForList.id}
          auftragTitle={selectedAuftragForList.title}
        />
      )}
    </div>
  );
};

export default AuftraegeManager;
