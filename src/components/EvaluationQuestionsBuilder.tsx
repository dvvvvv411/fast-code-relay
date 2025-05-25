
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, GripVertical } from 'lucide-react';

interface EvaluationQuestion {
  id: string;
  question_text: string;
  question_order: number;
}

interface EvaluationQuestionsBuilderProps {
  questions: EvaluationQuestion[];
  onChange: (questions: EvaluationQuestion[]) => void;
}

const EvaluationQuestionsBuilder = ({ questions, onChange }: EvaluationQuestionsBuilderProps) => {
  const [newQuestion, setNewQuestion] = useState('');

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    
    const question: EvaluationQuestion = {
      id: `temp-${Date.now()}`,
      question_text: newQuestion.trim(),
      question_order: questions.length
    };
    
    onChange([...questions, question]);
    setNewQuestion('');
  };

  const removeQuestion = (id: string) => {
    const updatedQuestions = questions
      .filter(q => q.id !== id)
      .map((q, index) => ({ ...q, question_order: index }));
    onChange(updatedQuestions);
  };

  const updateQuestion = (id: string, text: string) => {
    const updatedQuestions = questions.map(q => 
      q.id === id ? { ...q, question_text: text } : q
    );
    onChange(updatedQuestions);
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Bewertungsfragen</Label>
      
      {questions.map((question, index) => (
        <Card key={question.id} className="p-3">
          <div className="flex items-center gap-3">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium min-w-[20px]">{index + 1}.</span>
            <Input
              value={question.question_text}
              onChange={(e) => updateQuestion(question.id, e.target.value)}
              placeholder="Bewertungsfrage eingeben..."
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeQuestion(question.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
      
      <Card className="p-3 border-dashed">
        <div className="flex gap-2">
          <Input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Neue Bewertungsfrage hinzufügen..."
            className="flex-1"
            onKeyPress={(e) => e.key === 'Enter' && addQuestion()}
          />
          <Button onClick={addQuestion} className="bg-orange hover:bg-orange-dark">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </Card>
      
      <p className="text-sm text-gray-500">
        Diese Fragen werden am Ende des Auftrags zur Bewertung angezeigt (1-5 Sterne + Textfeld).
      </p>
    </div>
  );
};

export default EvaluationQuestionsBuilder;
