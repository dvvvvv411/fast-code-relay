
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home } from 'lucide-react';

const ContractSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-700">
            Erfolgreich übermittelt!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Vielen Dank! Ihre Arbeitsvertrag-Informationen wurden erfolgreich übermittelt.
          </p>
          
          <p className="text-sm text-gray-500">
            Wir werden Ihre Angaben prüfen und uns zeitnah bei Ihnen melden.
          </p>
          
          <div className="pt-4">
            <Button 
              onClick={() => navigate('/')} 
              variant="outline"
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Zur Startseite
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractSuccess;
