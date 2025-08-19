import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Calendar, Globe, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    gender: "",
    ageGroup: "",
    culture: "",
    language: "nl-NL",
    interests: [] as string[],
  });

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Save preferences and navigate to dashboard
      localStorage.setItem("userPreferences", JSON.stringify(formData));
      navigate("/dashboard");
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate("/");
    }
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => {
      const interests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      
      return { ...prev, interests };
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-amber-900">Vertel ons iets over jezelf</h2>
              <p className="text-amber-700 mt-2">Dit helpt ons de juiste lezer voor je te vinden</p>
            </div>
            
            <div className="space-y-4">
              <Label className="text-amber-900">Wat is je geslacht?</Label>
              <RadioGroup 
                value={formData.gender} 
                onValueChange={(value) => setFormData({...formData, gender: value})}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Vrouw</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Man</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Anders</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-amber-900">Leeftijd</h2>
              <p className="text-amber-700 mt-2">Welke leeftijdsgroep voelt het beste bij je?</p>
            </div>
            
            <div className="space-y-4">
              <RadioGroup 
                value={formData.ageGroup} 
                onValueChange={(value) => setFormData({...formData, ageGroup: value})}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="18-25" id="18-25" />
                  <Label htmlFor="18-25">18-25 jaar</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="26-40" id="26-40" />
                  <Label htmlFor="26-40">26-40 jaar</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="41-60" id="41-60" />
                  <Label htmlFor="41-60">41-60 jaar</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="60+" id="60+" />
                  <Label htmlFor="60+">60+ jaar</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Globe className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-amber-900">Cultuur & Taal</h2>
              <p className="text-amber-700 mt-2">Waar voel je je cultureel verbonden?</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-amber-900">Cultuur</Label>
                <Select 
                  value={formData.culture} 
                  onValueChange={(value) => setFormData({...formData, culture: value})}
                >
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="Selecteer je cultuur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nl">Nederland</SelectItem>
                    <SelectItem value="tr">Turkije</SelectItem>
                    <SelectItem value="en">Verenigd Koninkrijk</SelectItem>
                    <SelectItem value="es">Spanje</SelectItem>
                    <SelectItem value="de">Duitsland</SelectItem>
                    <SelectItem value="fr">Frankrijk</SelectItem>
                    <SelectItem value="it">Italië</SelectItem>
                    <SelectItem value="gr">Griekenland</SelectItem>
                    <SelectItem value="no">Noorwegen</SelectItem>
                    <SelectItem value="ma">Marokko</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-amber-900">Voorkeurstaal</Label>
                <Select 
                  value={formData.language} 
                  onValueChange={(value) => setFormData({...formData, language: value})}
                >
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="Selecteer je taal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nl-NL">Nederlands</SelectItem>
                    <SelectItem value="en-GB">English</SelectItem>
                    <SelectItem value="tr-TR">Türkçe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Heart className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-amber-900">Jouw Interesses</h2>
              <p className="text-amber-700 mt-2">Waar ben je nieuwsgierig naar?</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                "Tarot", 
                "Koffiedik", 
                "Numerologie", 
                "Droomduiding", 
                "Aura/Chakra", 
                "Astrologie"
              ].map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.interests.includes(interest)
                      ? "border-amber-500 bg-amber-50 text-amber-900"
                      : "border-amber-200 hover:border-amber-300"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card className="bg-white/80 backdrop-blur-sm border-amber-200">
          <CardHeader>
            <CardTitle className="text-center">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-amber-700">Stap {step} van 4</span>
                <span className="text-sm text-amber-700">
                  {Math.round((step / 4) * 100)}%
                </span>
              </div>
              <div className="w-full bg-amber-200 rounded-full h-2">
                <div 
                  className="bg-amber-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(step / 4) * 100}%` }}
                ></div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {renderStep()}
            
            <div className="flex justify-between mt-8">
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                Terug
              </Button>
              <Button 
                onClick={handleNext}
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={
                  (step === 1 && !formData.gender) ||
                  (step === 2 && !formData.ageGroup) ||
                  (step === 3 && (!formData.culture || !formData.language))
                }
              >
                {step === 4 ? "Afronden" : "Volgende"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;