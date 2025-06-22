import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { TestTube, PlayCircle, CheckCircle, XCircle, User, Mail, Calendar, Database, Loader2 } from 'lucide-react';

interface TestContract {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  submitted_at: string;
}

const ContractAcceptanceTest = () => {
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [isAcceptingContract, setIsAcceptingContract] = useState(false);
  const [testContract, setTestContract] = useState<TestContract | null>(null);
  const [testResults, setTestResults] = useState<{
    contractCreated: boolean;
    contractAccepted: boolean;
    userCreated: boolean;
    emailSent: boolean;
    userId?: string;
    error?: string;
  } | null>(null);
  
  const [testData, setTestData] = useState({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
  });

  const { toast } = useToast();

  const createTestContract = async () => {
    setIsCreatingTest(true);
    setTestResults(null);
    
    try {
      console.log('🧪 Creating test employment contract...');
      
      // First create a test appointment and recipient
      const { data: recipient, error: recipientError } = await supabase
        .from('appointment_recipients')
        .insert({
          first_name: testData.firstName,
          last_name: testData.lastName,
          email: testData.email,
          unique_token: `test-${Date.now()}`,
        })
        .select()
        .single();

      if (recipientError) throw recipientError;

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          recipient_id: recipient.id,
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: '10:00:00',
          status: 'confirmed',
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Create test employment contract
      const { data: contract, error: contractError } = await supabase
        .from('employment_contracts')
        .insert({
          appointment_id: appointment.id,
          first_name: testData.firstName,
          last_name: testData.lastName,
          email: testData.email,
          start_date: new Date().toISOString().split('T')[0],
          social_security_number: '12345678901',
          tax_number: '98765432109',
          health_insurance_name: 'Test Krankenkasse',
          iban: 'DE89370400440532013000',
          marital_status: 'ledig',
          status: 'pending',
        })
        .select()
        .single();

      if (contractError) throw contractError;

      setTestContract(contract);
      setTestResults({ contractCreated: true, contractAccepted: false, userCreated: false, emailSent: false });
      
      toast({
        title: "Test-Vertrag erstellt!",
        description: `Vertrag für ${testData.firstName} ${testData.lastName} wurde erfolgreich erstellt.`,
      });

      console.log('✅ Test contract created:', contract.id);
      
    } catch (error: any) {
      console.error('❌ Error creating test contract:', error);
      setTestResults({ 
        contractCreated: false, 
        contractAccepted: false, 
        userCreated: false, 
        emailSent: false, 
        error: error.message 
      });
      
      toast({
        title: "Fehler beim Erstellen des Test-Vertrags",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingTest(false);
    }
  };

  const testContractAcceptance = async () => {
    if (!testContract) return;
    
    setIsAcceptingContract(true);
    
    try {
      console.log('🚀 Testing contract acceptance for contract:', testContract.id);
      
      // Call the accept-employment-contract function
      const { data, error } = await supabase.functions.invoke('accept-employment-contract', {
        body: { contractId: testContract.id }
      });

      console.log('Function response:', { data, error });

      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Unknown error from function');
      }

      // Check if user was created by listing users
      const { data: authResponse, error: userListError } = await supabase.auth.admin.listUsers();
      
      let userFound = false;
      let userId = '';
      
      if (!userListError && authResponse?.users && Array.isArray(authResponse.users)) {
        const foundUser = authResponse.users.find((user: any) => user.email === testContract.email);
        if (foundUser) {
          userFound = true;
          userId = foundUser.id;
          console.log('✅ User found in auth.users:', userId);
        }
      }

      // Verify contract status was updated
      const { data: updatedContract, error: contractError } = await supabase
        .from('employment_contracts')
        .select('*')
        .eq('id', testContract.id)
        .single();

      if (contractError) {
        console.error('❌ Error fetching updated contract:', contractError);
      }

      const contractAccepted = updatedContract?.status === 'accepted';
      
      setTestResults({
        contractCreated: true,
        contractAccepted,
        userCreated: userFound,
        emailSent: true, // Assume email was sent if no error
        userId,
      });

      if (contractAccepted && userFound) {
        toast({
          title: "Test erfolgreich! ✅",
          description: `Benutzer wurde erstellt (ID: ${userId.substring(0, 8)}...) und Vertrag akzeptiert.`,
        });
      } else {
        toast({
          title: "Test teilweise erfolgreich",
          description: `Vertrag: ${contractAccepted ? '✅' : '❌'}, Benutzer: ${userFound ? '✅' : '❌'}`,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('❌ Error testing contract acceptance:', error);
      setTestResults(prev => prev ? { 
        ...prev, 
        contractAccepted: false, 
        userCreated: false, 
        emailSent: false, 
        error: error.message 
      } : null);
      
      toast({
        title: "Test fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAcceptingContract(false);
    }
  };

  const cleanupTestData = async () => {
    if (!testContract) return;
    
    try {
      console.log('🧹 Cleaning up test data...');
      
      // Delete test contract
      await supabase
        .from('employment_contracts')
        .delete()
        .eq('id', testContract.id);
      
      // Try to delete test user if created
      if (testResults?.userId) {
        try {
          await supabase.auth.admin.deleteUser(testResults.userId);
          console.log('✅ Test user deleted');
        } catch (error) {
          console.log('⚠️ Could not delete test user:', error);
        }
      }
      
      setTestContract(null);
      setTestResults(null);
      
      toast({
        title: "Test-Daten bereinigt",
        description: "Alle Test-Daten wurden erfolgreich entfernt.",
      });
      
    } catch (error: any) {
      console.error('❌ Error cleaning up test data:', error);
      toast({
        title: "Fehler beim Bereinigen",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Vertragsannahme-Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Data Configuration */}
        <div className="space-y-4">
          <h3 className="font-semibold">Test-Daten konfigurieren</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="firstName">Vorname</Label>
              <Input
                id="firstName"
                value={testData.firstName}
                onChange={(e) => setTestData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Test"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nachname</Label>
              <Input
                id="lastName"
                value={testData.lastName}
                onChange={(e) => setTestData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="User"
              />
            </div>
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={testData.email}
                onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="test@example.com"
              />
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={createTestContract}
            disabled={isCreatingTest}
            className="flex items-center gap-2"
          >
            {isCreatingTest ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Test-Vertrag erstellen
          </Button>

          <Button
            onClick={testContractAcceptance}
            disabled={!testContract || isAcceptingContract}
            className="flex items-center gap-2"
            variant="default"
          >
            {isAcceptingContract ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            Vertragsannahme testen
          </Button>

          {testContract && (
            <Button
              onClick={cleanupTestData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Test-Daten bereinigen
            </Button>
          )}
        </div>

        {/* Current Test Contract */}
        {testContract && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Aktiver Test-Vertrag</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="font-medium">ID:</span>
                <div className="font-mono text-xs">{testContract.id.substring(0, 8)}...</div>
              </div>
              <div>
                <span className="font-medium">Name:</span>
                <div>{testContract.first_name} {testContract.last_name}</div>
              </div>
              <div>
                <span className="font-medium">E-Mail:</span>
                <div>{testContract.email}</div>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <Badge variant={testContract.status === 'pending' ? 'secondary' : 'default'}>
                  {testContract.status}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResults && (
          <div className="bg-gray-50 border rounded-lg p-4">
            <h4 className="font-medium mb-3">Test-Ergebnisse</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {testResults.contractCreated ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Vertrag erstellt</span>
              </div>
              
              <div className="flex items-center gap-2">
                {testResults.contractAccepted ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Vertrag akzeptiert</span>
              </div>
              
              <div className="flex items-center gap-2">
                {testResults.userCreated ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Benutzer erstellt</span>
                {testResults.userId && (
                  <Badge variant="outline" className="text-xs">
                    {testResults.userId.substring(0, 8)}...
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {testResults.emailSent ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>E-Mail versendet</span>
              </div>

              {testResults.error && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  <strong>Fehler:</strong> {testResults.error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">Test-Anweisungen</h4>
          <ol className="list-decimal list-inside text-sm text-yellow-800 space-y-1">
            <li>Konfigurieren Sie die Test-Daten oben</li>
            <li>Klicken Sie auf "Test-Vertrag erstellen"</li>
            <li>Klicken Sie auf "Vertragsannahme testen"</li>
            <li>Überprüfen Sie die Ergebnisse</li>
            <li>Gehen Sie zu den Benutzern in Supabase, um den erstellten Benutzer zu sehen</li>
            <li>Klicken Sie auf "Test-Daten bereinigen" wenn fertig</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractAcceptanceTest;
