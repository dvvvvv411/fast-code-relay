
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { TestTube, PlayCircle, CheckCircle, XCircle, User, Mail, Calendar, Database, Loader2, AlertTriangle, Users } from 'lucide-react';

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
  const [isCreatingBulk, setIsCreatingBulk] = useState(false);
  const [isAcceptingContract, setIsAcceptingContract] = useState(false);
  const [testContract, setTestContract] = useState<TestContract | null>(null);
  const [bulkCount, setBulkCount] = useState(5);
  const [testResults, setTestResults] = useState<{
    contractCreated: boolean;
    contractAccepted: boolean;
    userIdReturned: boolean;
    contractUserIdSet: boolean;
    functionSuccess: boolean;
    userId?: string;
    error?: string;
  } | null>(null);
  
  const [testData, setTestData] = useState({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
  });

  const { toast } = useToast();

  const generateRandomData = () => {
    const firstNames = ['Max', 'Anna', 'Peter', 'Lisa', 'Tom', 'Sarah', 'Ben', 'Emma', 'Tim', 'Lena', 'Jan', 'Mia', 'Felix', 'Nina', 'Paul'];
    const lastNames = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Klein', 'Wolf', 'Neumann', 'Schwarz', 'Zimmermann'];
    const maritalStatuses = ['ledig', 'verheiratet', 'geschieden', 'verwitwet'];
    const healthInsurances = ['AOK', 'Barmer', 'TK', 'DAK', 'IKK', 'BKK'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@yopmail.com`;
    
    return {
      firstName,
      lastName,
      email,
      socialSecurityNumber: `${Math.floor(Math.random() * 90000000) + 10000000}${Math.floor(Math.random() * 900) + 100}`,
      taxNumber: `${Math.floor(Math.random() * 900000000) + 100000000}${Math.floor(Math.random() * 90) + 10}`,
      healthInsurance: healthInsurances[Math.floor(Math.random() * healthInsurances.length)],
      iban: `DE${Math.floor(Math.random() * 90) + 10}${Math.floor(Math.random() * 900000000000000000) + 100000000000000000}`,
      maritalStatus: maritalStatuses[Math.floor(Math.random() * maritalStatuses.length)]
    };
  };

  const createBulkTestContracts = async () => {
    setIsCreatingBulk(true);
    
    try {
      console.log(`🧪 Creating ${bulkCount} test employment contracts...`);
      
      const contractsToCreate = [];
      
      for (let i = 0; i < bulkCount; i++) {
        const randomData = generateRandomData();
        
        // Create test appointment and recipient for each contract
        const { data: recipient, error: recipientError } = await supabase
          .from('appointment_recipients')
          .insert({
            first_name: randomData.firstName,
            last_name: randomData.lastName,
            email: randomData.email,
            unique_token: `bulk-test-${Date.now()}-${i}`,
          })
          .select()
          .single();

        if (recipientError) throw recipientError;

        const { data: appointment, error: appointmentError } = await supabase
          .from('appointments')
          .insert({
            recipient_id: recipient.id,
            appointment_date: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            appointment_time: `${Math.floor(Math.random() * 8) + 9}:00:00`,
            status: 'confirmed',
          })
          .select()
          .single();

        if (appointmentError) throw appointmentError;

        contractsToCreate.push({
          appointment_id: appointment.id,
          first_name: randomData.firstName,
          last_name: randomData.lastName,
          email: randomData.email,
          start_date: new Date(Date.now() + Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          social_security_number: randomData.socialSecurityNumber,
          tax_number: randomData.taxNumber,
          health_insurance_name: randomData.healthInsurance,
          iban: randomData.iban,
          marital_status: randomData.maritalStatus,
          status: 'pending',
        });
      }

      // Insert all contracts at once
      const { data: contracts, error: contractError } = await supabase
        .from('employment_contracts')
        .insert(contractsToCreate)
        .select();

      if (contractError) throw contractError;

      toast({
        title: "Bulk-Test-Verträge erstellt!",
        description: `${bulkCount} Verträge mit @yopmail.com E-Mail-Adressen wurden erfolgreich erstellt.`,
      });

      console.log(`✅ ${bulkCount} test contracts created successfully`);
      
    } catch (error: any) {
      console.error('❌ Error creating bulk test contracts:', error);
      
      toast({
        title: "Fehler beim Erstellen der Bulk-Test-Verträge",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingBulk(false);
    }
  };

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
      setTestResults({ 
        contractCreated: true, 
        contractAccepted: false, 
        userIdReturned: false, 
        contractUserIdSet: false, 
        functionSuccess: false 
      });
      
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
        userIdReturned: false, 
        contractUserIdSet: false, 
        functionSuccess: false, 
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

      // Extract userId from function response
      const userIdFromFunction = data?.userId;
      const userIdReturned = !!userIdFromFunction;

      console.log('✅ Function executed successfully, userId returned:', userIdFromFunction);

      // Verify contract status was updated and user_id was set
      const { data: updatedContract, error: contractError } = await supabase
        .from('employment_contracts')
        .select('*')
        .eq('id', testContract.id)
        .single();

      if (contractError) {
        console.error('❌ Error fetching updated contract:', contractError);
      }

      const contractAccepted = updatedContract?.status === 'accepted';
      const contractUserIdSet = !!updatedContract?.user_id;
      
      console.log('Contract verification:', {
        status: updatedContract?.status,
        user_id: updatedContract?.user_id,
        contractAccepted,
        contractUserIdSet
      });

      setTestResults({
        contractCreated: true,
        contractAccepted,
        userIdReturned,
        contractUserIdSet,
        functionSuccess: data?.success,
        userId: userIdFromFunction,
      });

      const allTestsPassed = contractAccepted && userIdReturned && contractUserIdSet;

      if (allTestsPassed) {
        toast({
          title: "Test erfolgreich! ✅",
          description: `Benutzer wurde erstellt (ID: ${userIdFromFunction?.substring(0, 8)}...) und Vertrag akzeptiert.`,
        });
      } else {
        const failedTests = [];
        if (!contractAccepted) failedTests.push('Vertragsstatus');
        if (!userIdReturned) failedTests.push('Benutzer-ID von Funktion');
        if (!contractUserIdSet) failedTests.push('Benutzer-ID im Vertrag');
        
        toast({
          title: "Test teilweise erfolgreich",
          description: `Fehlgeschlagen: ${failedTests.join(', ')}`,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('❌ Error testing contract acceptance:', error);
      setTestResults(prev => prev ? { 
        ...prev, 
        contractAccepted: false, 
        userIdReturned: false, 
        contractUserIdSet: false, 
        functionSuccess: false, 
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
      
      // Delete test contract (this will cascade delete related records)
      await supabase
        .from('employment_contracts')
        .delete()
        .eq('id', testContract.id);
      
      setTestContract(null);
      setTestResults(null);
      
      toast({
        title: "Test-Daten bereinigt",
        description: "Test-Vertrag wurde erfolgreich entfernt. Hinweis: Erstellte Benutzerkonten müssen manuell über die Supabase-Konsole gelöscht werden.",
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
        {/* Bulk Creation Section */}
        <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk-Test-Verträge erstellen
          </h3>
          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="bulkCount">Anzahl Verträge</Label>
              <Input
                id="bulkCount"
                type="number"
                min="1"
                max="50"
                value={bulkCount}
                onChange={(e) => setBulkCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                className="w-20"
              />
            </div>
            <Button
              onClick={createBulkTestContracts}
              disabled={isCreatingBulk}
              className="flex items-center gap-2"
            >
              {isCreatingBulk ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              {bulkCount} Verträge erstellen
            </Button>
          </div>
          <p className="text-sm text-blue-800">
            Erstellt {bulkCount} zufällige Arbeitsverträge mit @yopmail.com E-Mail-Adressen, deutschen Namen und realistischen Daten.
          </p>
        </div>

        {/* Test Data Configuration */}
        <div className="space-y-4">
          <h3 className="font-semibold">Einzelnen Test-Vertrag konfigurieren</h3>
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
                {testResults.functionSuccess ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Edge Function erfolgreich</span>
              </div>
              
              <div className="flex items-center gap-2">
                {testResults.contractAccepted ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Vertrag akzeptiert (Status geändert)</span>
              </div>
              
              <div className="flex items-center gap-2">
                {testResults.userIdReturned ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Benutzer-ID von Funktion zurückgegeben</span>
                {testResults.userId && (
                  <Badge variant="outline" className="text-xs">
                    {testResults.userId.substring(0, 8)}...
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {testResults.contractUserIdSet ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Benutzer-ID im Vertrag gesetzt</span>
              </div>

              {testResults.error && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  <strong>Fehler:</strong> {testResults.error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Verification Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-900 mb-2">Admin-Verifikation</h4>
              <p className="text-sm text-amber-800 mb-2">
                Um zu überprüfen, ob der Benutzer tatsächlich erstellt wurde, können Admins die Benutzerliste in der Supabase-Konsole einsehen.
              </p>
              <p className="text-sm text-amber-800">
                Die automatische Verifikation über die Benutzerliste ist aus Sicherheitsgründen nur für Service-Role-Keys verfügbar.
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Test-Anweisungen</h4>
          <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
            <li>Für Bulk-Erstellung: Anzahl wählen und "X Verträge erstellen" klicken</li>
            <li>Für Einzeltest: Test-Daten konfigurieren und "Test-Vertrag erstellen" klicken</li>
            <li>Klicken Sie auf "Vertragsannahme testen"</li>
            <li>Überprüfen Sie die Ergebnisse - alle Tests sollten ✅ zeigen</li>
            <li>Gehen Sie zur Supabase-Konsole → Authentication → Users, um die erstellten Benutzer zu sehen</li>
            <li>Klicken Sie auf "Test-Daten bereinigen" wenn fertig</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractAcceptanceTest;
