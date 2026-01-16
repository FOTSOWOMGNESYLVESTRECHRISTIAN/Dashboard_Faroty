import { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Loader2 } from 'lucide-react';
import { getCountries } from '../services/paymentService'; // Import the service
import { Country } from '../types/payment';

interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAccount: (data: {
    accountName: string;
    accountMode: 'PERSONAL' | 'BUSINESS' | 'SANDBOX' | 'LIVE';
    email: string;
    country: string;
    currency?: string;
  }) => Promise<boolean>;
}

// Liste des devises disponibles
const CURRENCIES = [
  { code: 'XOF', name: 'Franc CFA (XOF)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'USD', name: 'Dollar américain ($)' },
  { code: 'CAD', name: 'Dollar canadien (CAD)' },
  { code: 'CHF', name: 'Franc suisse (CHF)' },
];

export function CreateAccountDialog({ open, onOpenChange, onCreateAccount }: CreateAccountDialogProps) {
  const [formData, setFormData] = useState({
    accountName: '',
    accountMode: 'PERSONAL' as 'PERSONAL' | 'BUSINESS' | 'SANDBOX' | 'LIVE',
    email: '',
    country: '', // Default to empty, will be set after fetch
    currency: 'XOF',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        const fetchedCountries = await getCountries();
        setCountries(fetchedCountries);
        if (fetchedCountries.length > 0 && !formData.country) {
          // Default to CM or first available
          const defaultCountry = fetchedCountries.find(c => c.code === 'CM') || fetchedCountries[0];
          setFormData(prev => ({ ...prev, country: defaultCountry.code }));
        }
      } catch (error) {
        console.error("Failed to fetch countries", error);
      } finally {
        setLoadingCountries(false);
      }
    };

    if (open) {
      fetchCountries();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountName || !formData.email) {
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onCreateAccount({
        ...formData,
        country: formData.country,
      });

      if (success) {
        // Réinitialiser le formulaire uniquement si la création a réussi
        setFormData({
          accountName: '',
          accountMode: 'PERSONAL',
          email: '',
          country: countries.length > 0 ? (countries.find(c => c.code === 'CM')?.code || countries[0].code) : '',
          currency: 'XOF',
        });
      }
    } catch (error) {
      console.error('Error creating account:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="bg-gradient-to-r from-gray-50 to-white pb-6 border-b border-gray-100">
            <DialogTitle className="text-xl font-bold text-gray-800">Créer un nouveau compte</DialogTitle>
            <DialogDescription className="text-gray-500">
              Remplissez les informations pour créer un nouveau compte.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6 px-1">
            <div className="space-y-2">
              <Label htmlFor="accountName" className="font-semibold text-gray-700">
                Nom du compte <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountName"
                value={formData.accountName}
                onChange={(e) =>
                  setFormData({ ...formData, accountName: e.target.value })
                }
                placeholder="Entrez le nom du compte"
                required
                className="font-medium border-gray-300 focus:border-indigo-500 focus:ring-indigo-200 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-gray-700">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@exemple.com"
                required
                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-200 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="accountMode" className="font-semibold text-gray-700">Type de compte</Label>
                <Select
                  value={formData.accountMode}
                  onValueChange={(value: 'PERSONAL' | 'BUSINESS' | 'SANDBOX' | 'LIVE') =>
                    setFormData({ ...formData, accountMode: value })
                  }
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONAL">Personnel</SelectItem>
                    <SelectItem value="BUSINESS">Entreprise</SelectItem>
                    <SelectItem value="SANDBOX">Sandbox (Test)</SelectItem>
                    <SelectItem value="LIVE">Live (Production)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="font-semibold text-gray-700">Pays</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, country: value })
                  }
                  disabled={loadingCountries}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder={loadingCountries ? "Chargement..." : "Sélectionnez un pays"} />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.nameFr || country.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="font-semibold text-gray-700">Devise</Label>
              <Select
                value={formData.currency}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Sélectionnez une devise" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-6 border-t border-gray-100 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="hover:bg-gray-50 border-gray-200"
              style={{cursor:'pointer'
              }}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.accountName || !formData.email}
              className="bg-green-600 hover:bg-green-700 border-none hover:shadow-lg transition-all cursor-pointer"
              style={{cursor:'pointer'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
