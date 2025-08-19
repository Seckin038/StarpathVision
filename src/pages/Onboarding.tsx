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
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-amber-200">Vertel ons iets over jezelf</h2>
              <p className="text-stone-400 mt-2">Dit helpt ons de juiste lezer voor je te vinden</p>
            </div>
            <div className="space-y-4">
              <Label className="text-stone-300">Wat is je geslacht?</Label>
              <RadioGroup 
                value={formData.gender} 
                onValueChange={(value) => setFormData({...formData, gender: value})}
                className="grid grid-cols-3 gap-4"
              >
                {["Vrouw", "Man", "Anders"].map(g => (
                  <div key={g} className="flex items-center space-x-2">
                    <RadioGroupItem value={g.toLowerCase()} id={g.toLowerCase()} />
                    <Label htmlFor={g.toLowerCase()}>{g}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-amber-200">Leeftijd</h2>
              <p className="text-stone-400 mt-2">Welke leeftijdsgroep voelt het beste bij je?</p>
            </div>
            <RadioGroup 
              value={formData.ageGroup} 
              onValueChange={(value) => setFormData({...formData, ageGroup: value})}
              className="space-y-3"
            >
              {["18-25", "26-40", "41-60", "60+"].map(age => (
                <div key={age} className="flex items-center space-x-3">
                  <RadioGroupItem value={age} id={age} />
                  <Label htmlFor={age}>{age} jaar</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Globe className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-amber-200">Cultuur & Taal</h2>
              <p className="text-stone-400 mt-2">Waar voel je je cultureel verbonden?</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-stone-300">Cultuur</Label>
                <Select value={formData.culture} onValueChange={(value) => setFormData({...formData, culture: value})}>
                  <SelectTrigger className="w-full mt-2 bg-stone-900 border-stone-700"><SelectValue placeholder="Selecteer je cultuur" /></SelectTrigger>
                  <SelectContent className="bg-stone-900 border-stone-700 text-stone-200">
                    <SelectItem value="nl">Nederland</SelectItem>
                    <SelectItem value="be">België</SelectItem>
                    <SelectItem value="tr">Turkije</SelectItem>
                    <SelectItem value="de">Duitsland</SelectItem>
                    <SelectItem value="gb">Verenigd Koninkrijk</SelectItem>
                    <SelectItem value="fr">Frankrijk</SelectItem>
                    <SelectItem value="ma">Marokko</SelectItem>
                    <SelectItem value="other">Anders / Internationaal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-stone-300">Voorkeurstaal</Label>
                <Select value={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
                  <SelectTrigger className="w-full mt-2 bg-stone-900 border-stone-700"><SelectValue placeholder="Selecteer je taal" /></SelectTrigger>
                  <SelectContent className="bg-stone-900 border-stone-700 text-stone-200">
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
              <Heart className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-amber-200">Jouw Interesses</h2>
              <p className="text-stone-400 mt-2">Waar ben je nieuwsgierig naar?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["Tarot", "Koffiedik", "Numerologie", "Droomduiding", "Aura/Chakra", "Astrologie"].map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.interests.includes(interest)
                      ? "border-amber-700 bg-stone-800 text-amber-200"
                      : "border-stone-700 hover:border-stone-600 bg-stone-900/50"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        );
      
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-black to-stone-950 text-stone-200 p-4 flex items-center justify-center font-serif">
      <div className="w-full max-w-md">
        <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
          <CardHeader>
            <CardTitle>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-stone-400">Stap {step} van 4</span>
                <span className="text-sm text-stone-400">{Math.round((step / 4) * 100)}%</span>
              </div>
              <div className="w-full bg-stone-800 rounded-full h-2">
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
              <Button variant="outline" onClick={handleBack} className="border-stone-700 text-stone-300 hover:bg-stone-800">Terug</Button>
              <Button 
                onClick={handleNext}
                className="bg-amber-800 hover:bg-amber-700 text-stone-100"
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