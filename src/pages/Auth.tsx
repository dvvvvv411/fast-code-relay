
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, Lock } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signInAndRedirect } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const result = await signInAndRedirect(email, password);
    
    if (result.success) {
      toast({
        title: "Erfolgreich angemeldet",
        description: "Sie wurden erfolgreich angemeldet.",
      });
    } else {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: result.error || "Bitte überprüfen Sie Ihre Anmeldedaten.",
        variant: "destructive",
      });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-6xl overflow-hidden shadow-2xl animate-scale-in">
          <CardContent className="p-0">
            <div className="flex min-h-[600px]">
              {/* Left Section - Animation */}
              <div className="w-full lg:w-1/2 relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 orange-gradient"></div>
                
                {/* Animated Geometric Shapes */}
                <div className="absolute inset-0">
                  <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full animate-pulse-slow"></div>
                  <div className="absolute top-40 right-32 w-24 h-24 bg-white/20 rotate-45 animate-pulse delay-1000"></div>
                  <div className="absolute bottom-32 left-32 w-40 h-40 bg-white/5 rounded-lg rotate-12 animate-pulse delay-2000"></div>
                  <div className="absolute bottom-20 right-20 w-16 h-16 bg-white/15 rounded-full animate-bounce"></div>
                </div>
                
                {/* Content Overlay */}
                <div className="relative z-10 flex flex-col justify-center items-center text-center p-12 text-white h-full">
                  <div className="animate-fade-in">
                    <h2 className="text-4xl font-bold mb-6">Willkommen zurück</h2>
                    <p className="text-xl mb-8 opacity-90">
                      Melden Sie sich an, um auf Ihr Administrator-Dashboard zuzugreifen
                    </p>
                    
                    {/* Login Icon Animation */}
                    <div className="relative">
                      <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-scale-in">
                        <Lock className="h-12 w-12 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-white/30 rounded-full animate-ping"></div>
                    </div>
                    
                    <div className="text-lg opacity-80">
                      Sicherer Zugang zu Ihrem Verwaltungsbereich
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section - Login Form */}
              <div className="w-full lg:w-1/2 flex items-center justify-center p-12 bg-white">
                <div className="w-full max-w-md">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Administrator-Zugang</h1>
                    <p className="text-gray-600">
                      Melden Sie sich an, um den Admin-Bereich zu nutzen
                    </p>
                  </div>
                  
                  <form onSubmit={handleSignIn} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-gray-700">
                        E-Mail
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="pl-10 h-12 transition-all duration-200 focus:scale-[1.02] border-gray-300 focus:border-orange focus:ring-orange"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Passwort
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10 h-12 transition-all duration-200 focus:scale-[1.02] border-gray-300 focus:border-orange focus:ring-orange"
                          required
                        />
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-orange hover:bg-orange-dark transition-all duration-200 hover:scale-[1.02] hover:shadow-lg text-white font-medium text-base"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Wird angemeldet...' : 'Anmelden'}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
