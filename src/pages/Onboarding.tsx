import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User, Heart, Star, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCoreValues, updateMyProfile } from "@/lib/profile";
import { showError, showSuccess } from "@/utils/toast";

type CoreValue = { id: string; name_nl: string; name_en: string; name_tr: string };

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    gender: "",
    focus_areas: [] as string[],
    core_values: [] as string[],
  });
  const [coreValues, setCoreValues] = useState<CoreValue[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchValues = async () => {
      try {
        const values = await getCoreValues();
        setCoreValues(values);
      } catch (error) {
        showError("Kon kernwaarden niet laden.");
      }
    };
    fetchValues();
  }, []);

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        await updateMyProfile({
          focus_areas: formData.focus_areas,
          core_values: formData.core_values,
          onboarding_done: true,
        });
        showSuccess("Profiel opgeslagen!");
        navigate("/dashboard");
      } catch (error: any) {
        showError(`Opslaan mislukt: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate("/");
    }
  };

  const handleToggle = (field: 'focus_areas' | 'core_values', value: string, max: number) => {
    setFormData(prev => {
      const currentValues = prev[field];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(i => i !== value)
        : [...currentValues, value];
      
      if (newValues.length > max) {
        return prev; // Do not update if max is exceeded
      }
      return { ...prev, [field]: newValues };
    });
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
        const focusOptions = [
          { id: 'love', label: 'Liefde & Relaties' },
          { id: 'career', label: 'Carrière & Werk' },
          { id: 'growth', label: 'Persoonlijke Groei' },
          { id: 'health', label: 'Gezondheid & Welzijn' },
          { id: 'spirituality', label: 'Spiritualiteit' },
          { id: 'finance', label: 'Financiën' },
        ];
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Heart className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-amber-200">Focusgebieden</h2>
              <p className="text-stone-400 mt-2">Kies 1 of 2 gebieden die nu belangrijk voor je zijn.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {focusOptions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleToggle('focus_areas', item.id, 2)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.focus_areas.includes(item.id)
                      ? "border-amber-700 bg-stone-800 text-amber-200"
                      : "border-stone-700 hover:border-stone-600 bg-stone-900/50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Star className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-amber-200">Kernwaarden</h2>
              <p className="text-stone-400 mt-2">Selecteer 3 tot 5 waarden die jou definiëren.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {coreValues.map((value) => (
                <button
                  key={value.id}
                  onClick={() => handleToggle('core_values', value.id, 5)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm ${
                    formData.core_values.includes(value.id)
                      ? "border-amber-700 bg-stone-800 text-amber-200"
                      : "border-stone-700 hover:border-stone-600 bg-stone-900/50"
                  }`}
                >
                  {value.name_nl}
                </button>
              ))}
            </div>
          </div>
        );
      
      default: return null;
    }
  };

  const TOTAL_STEPS = 3;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-black to-stone-950 text-stone-200 p-4 flex items-center justify-center font-serif">
      <div className="w-full max-w-md">
        <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
          <CardHeader>
            <CardTitle>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-stone-400">Stap {step} van {TOTAL_STEPS}</span>
                <span className="text-sm text-stone-400">{Math.round((step / TOTAL_STEPS) * 100)}%</span>
              </div>
              <div className="w-full bg-stone-800 rounded-full h-2">
                <div 
                  className="bg-amber-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
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
                  loading ||
                  (step === 1 && !formData.gender) ||
                  (step === 2 && formData.focus_areas.length === 0) ||
                  (step === 3 && (formData.core_values.length < 3 || formData.core_values.length > 5))
                }
              >
                {loading ? <Loader2 className="animate-spin" /> : (step === TOTAL_STEPS ? "Afronden" : "Volgende")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;