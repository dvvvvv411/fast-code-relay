
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface EvaluationQuestion {
  id: string;
  question_text: string;
  question_order: number;
}

interface EvaluationFormProps {
  assignmentId: string;
  questions: EvaluationQuestion[];
  onEvaluationComplete: () => void;
}

interface EvaluationAnswer {
  questionId: string;
  starRating: number;
  textFeedback: string;
}

const EvaluationForm = ({ assignmentId, questions, onEvaluationComplete }: EvaluationFormProps) => {
  const [answers, setAnswers] = useState<EvaluationAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize answers for all questions
    const initialAnswers = questions.map(q => ({
      questionId: q.id,
      starRating: 0,
      textFeedback: ''
    }));
    setAnswers(initialAnswers);
  }, [questions]);

  const updateAnswer = (questionId: string, field: 'starRating' | 'textFeedback', value: number | string) => {
    setAnswers(prev => prev.map(answer => 
      answer.questionId === questionId 
        ? { ...answer, [field]: value }
        : answer
    ));
  };

  const isFormValid = () => {
    return answers.every(answer => answer.starRating > 0 && answer.textFeedback.trim().length > 0);
  };

  const validateEvaluationData = () => {
    console.log('🔍 Validating evaluation data...');
    
    // Check if all required fields are filled
    const invalidAnswers = answers.filter(answer => 
      answer.starRating < 1 || answer.starRating > 5 || answer.textFeedback.trim().length === 0
    );
    
    if (invalidAnswers.length > 0) {
      console.error('❌ Invalid answers found:', invalidAnswers);
      return false;
    }
    
    // Check if assignmentId is valid
    if (!assignmentId || assignmentId.trim() === '') {
      console.error('❌ Invalid assignment ID:', assignmentId);
      return false;
    }
    
    // Check if questions exist
    if (questions.length === 0) {
      console.error('❌ No questions found for evaluation');
      return false;
    }
    
    console.log('✅ Validation passed for', answers.length, 'answers');
    return true;
  };

  const sendTelegramNotification = async (assignmentData: any) => {
    try {
      console.log('📱 Sending Telegram notification...');
      const { error } = await supabase.functions.invoke('send-telegram-notification', {
        body: {
          type: 'evaluation_completed',
          workerName: `${assignmentData.worker_first_name} ${assignmentData.worker_last_name}`,
          auftragTitle: assignmentData.auftraege.title,
          auftragsnummer: assignmentData.auftraege.auftragsnummer
        }
      });

      if (error) {
        console.error('❌ Error sending Telegram notification:', error);
        // Don't throw error here - notification failure shouldn't block the evaluation
      } else {
        console.log('✅ Telegram notification sent successfully');
      }
    } catch (error) {
      console.error('❌ Exception sending Telegram notification:', error);
      // Don't throw error here - notification failure shouldn't block the evaluation
    }
  };

  const handleSubmit = async () => {
    console.log('🚀 Starting evaluation submission process...');
    
    if (!isFormValid()) {
      console.error('❌ Form validation failed');
      toast({
        title: "Fehler",
        description: "Bitte bewerten Sie alle Fragen mit Sternen und geben Sie Textfeedback ab.",
        variant: "destructive"
      });
      return;
    }

    if (!validateEvaluationData()) {
      console.error('❌ Data validation failed');
      toast({
        title: "Fehler",
        description: "Die Bewertungsdaten sind ungültig. Bitte überprüfen Sie Ihre Eingaben.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📝 Preparing evaluation data for insert...');
      
      // Prepare evaluations for database insert with detailed logging
      const evaluationsToInsert = answers.map(answer => {
        const evaluation = {
          assignment_id: assignmentId,
          question_id: answer.questionId,
          star_rating: answer.starRating,
          text_feedback: answer.textFeedback || null
        };
        console.log('📊 Evaluation entry:', evaluation);
        return evaluation;
      });

      console.log(`💾 Inserting ${evaluationsToInsert.length} evaluations into database...`);
      
      // Step 1: Insert evaluations first
      const { data: insertedEvaluations, error: insertError } = await supabase
        .from('evaluations')
        .insert(evaluationsToInsert)
        .select();

      if (insertError) {
        console.error('❌ Error inserting evaluations:', insertError);
        throw new Error(`Failed to insert evaluations: ${insertError.message}`);
      }

      if (!insertedEvaluations || insertedEvaluations.length !== evaluationsToInsert.length) {
        console.error('❌ Unexpected insert result:', { 
          expected: evaluationsToInsert.length, 
          actual: insertedEvaluations?.length || 0 
        });
        throw new Error('Not all evaluations were saved successfully');
      }

      console.log('✅ Successfully inserted evaluations:', insertedEvaluations);

      // Step 2: Verify evaluations were actually saved
      console.log('🔍 Verifying evaluations were saved...');
      const { data: verificationData, error: verificationError } = await supabase
        .from('evaluations')
        .select('*')
        .eq('assignment_id', assignmentId);

      if (verificationError) {
        console.error('❌ Error verifying evaluations:', verificationError);
        throw new Error(`Failed to verify evaluations: ${verificationError.message}`);
      }

      if (!verificationData || verificationData.length !== evaluationsToInsert.length) {
        console.error('❌ Verification failed:', { 
          foundInDb: verificationData?.length || 0, 
          expected: evaluationsToInsert.length 
        });
        throw new Error('Evaluations verification failed - data not properly saved');
      }

      console.log('✅ Evaluations verified in database:', verificationData);

      // Step 3: Only now mark assignment as evaluated
      console.log('📝 Marking assignment as evaluated...');
      const { error: updateError } = await supabase
        .from('auftrag_assignments')
        .update({ is_evaluated: true })
        .eq('id', assignmentId);

      if (updateError) {
        console.error('❌ Error updating assignment status:', updateError);
        
        // Since evaluations are already saved, we should still proceed but warn the user
        toast({
          title: "Warnung",
          description: "Bewertung wurde gespeichert, aber der Status konnte nicht aktualisiert werden. Bitte kontaktieren Sie den Support.",
          variant: "destructive"
        });
        
        // Still call completion callback since evaluations are saved
        onEvaluationComplete();
        return;
      }

      console.log('✅ Assignment marked as evaluated successfully');

      // Step 4: Fetch assignment data for Telegram notification
      console.log('📋 Fetching assignment data for notification...');
      const { data: assignmentData, error: fetchError } = await supabase
        .from('auftrag_assignments')
        .select(`
          worker_first_name,
          worker_last_name,
          auftraege!inner(title, auftragsnummer)
        `)
        .eq('id', assignmentId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching assignment data for notification:', fetchError);
      } else {
        console.log('📋 Assignment data fetched for notification:', assignmentData);
        // Send Telegram notification (non-blocking)
        await sendTelegramNotification(assignmentData);
      }

      console.log('🎉 Evaluation submission completed successfully');
      
      toast({
        title: "Erfolg",
        description: "Ihre Bewertung wurde erfolgreich eingereicht."
      });

      onEvaluationComplete();
    } catch (error) {
      console.error('💥 Critical error during evaluation submission:', error);
      
      // Check if this is a database constraint error or connection error
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      
      toast({
        title: "Fehler",
        description: `Bewertung konnte nicht eingereicht werden: ${errorMessage}`,
        variant: "destructive"
      });
      
      // Log additional debugging information
      console.error('📊 Debug info:', {
        assignmentId,
        questionsCount: questions.length,
        answersCount: answers.length,
        validForm: isFormValid(),
        answers: answers
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, questionId }: { rating: number; onRatingChange: (rating: number) => void; questionId: string }) => {
    const [hoveredRating, setHoveredRating] = useState(0);

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none"
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => onRatingChange(star)}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= (hoveredRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Keine Bewertungsfragen für diesen Auftrag verfügbar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-orange-500" />
          Auftragsbewertung
        </CardTitle>
        <p className="text-sm text-gray-600">
          Bitte bewerten Sie den Auftrag anhand der folgenden Fragen:
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions
          .sort((a, b) => a.question_order - b.question_order)
          .map((question, index) => {
            const answer = answers.find(a => a.questionId === question.id);
            if (!answer) return null;

            return (
              <div key={question.id} className="space-y-3">
                <div>
                  <h3 className="font-medium mb-3">
                    {index + 1}. {question.question_text}
                  </h3>
                  <div className="flex items-center gap-3">
                    <StarRating
                      rating={answer.starRating}
                      onRatingChange={(rating) => updateAnswer(question.id, 'starRating', rating)}
                      questionId={question.id}
                    />
                    <span className="text-sm text-gray-500">
                      {answer.starRating > 0 && `(${answer.starRating}/5 Sterne)`}
                    </span>
                  </div>
                </div>
                <Textarea
                  placeholder="Bitte beantworten Sie diese Frage ausführlich und teilen Sie Ihre detaillierten Erfahrungen mit..."
                  value={answer.textFeedback}
                  onChange={(e) => updateAnswer(question.id, 'textFeedback', e.target.value)}
                  rows={3}
                />
              </div>
            );
          })}

        <div className="pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
            className="w-full bg-orange hover:bg-orange-dark"
          >
            {isSubmitting ? 'Wird eingereicht...' : 'Bewertung einreichen'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EvaluationForm;
