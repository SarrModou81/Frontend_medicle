// src/app/components/medecin/medecin-horaires/medecin-horaires.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService, User } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';

interface JourSemaine {
  id: string;
  nom: string;
  actif: boolean;
  debut: string;
  fin: string;
}

@Component({
  selector: 'app-medecin-horaires',
  templateUrl: './medecin-horaires.component.html',
  styleUrls: ['./medecin-horaires.component.scss']
})
export class MedecinHorairesComponent implements OnInit {
  currentUser: User | null = null;
  horairesForm!: FormGroup;
  isLoading = true;
  isSaving = false;
  
  joursSemaine: JourSemaine[] = [
    { id: 'lundi', nom: 'Lundi', actif: false, debut: '09:00', fin: '17:00' },
    { id: 'mardi', nom: 'Mardi', actif: false, debut: '09:00', fin: '17:00' },
    { id: 'mercredi', nom: 'Mercredi', actif: false, debut: '09:00', fin: '17:00' },
    { id: 'jeudi', nom: 'Jeudi', actif: false, debut: '09:00', fin: '17:00' },
    { id: 'vendredi', nom: 'Vendredi', actif: false, debut: '09:00', fin: '17:00' },
    { id: 'samedi', nom: 'Samedi', actif: false, debut: '09:00', fin: '17:00' },
    { id: 'dimanche', nom: 'Dimanche', actif: false, debut: '09:00', fin: '17:00' }
  ];

  heuresOptions: string[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.generateHeuresOptions();
    this.initializeForm();
    this.loadHorairesData();
  }

  private generateHeuresOptions(): void {
    for (let h = 6; h <= 22; h++) {
      for (let m = 0; m < 60; m += 15) {
        const heure = h.toString().padStart(2, '0');
        const minute = m.toString().padStart(2, '0');
        this.heuresOptions.push(`${heure}:${minute}`);
      }
    }
  }

  private initializeForm(): void {
    const formControls: any = {
      duree_consultation: [30, [Validators.required, Validators.min(15), Validators.max(120)]]
    };

    // Créer les contrôles pour chaque jour
    this.joursSemaine.forEach(jour => {
      formControls[`${jour.id}_actif`] = [false];
      formControls[`${jour.id}_debut`] = ['09:00', Validators.required];
      formControls[`${jour.id}_fin`] = ['17:00', Validators.required];
    });

    this.horairesForm = this.fb.group(formControls);

    // Ajouter des validateurs personnalisés pour vérifier que fin > début
    this.joursSemaine.forEach(jour => {
      this.horairesForm.get(`${jour.id}_fin`)?.setValidators([
        Validators.required,
        this.validateFinSuperieurDebut(jour.id)
      ]);
    });
  }

  private validateFinSuperieurDebut(jourId: string) {
    return (control: any) => {
      if (!control.value) return null;
      
      const debut = this.horairesForm?.get(`${jourId}_debut`)?.value;
      if (!debut) return null;
      
      const [debutH, debutM] = debut.split(':').map(Number);
      const [finH, finM] = control.value.split(':').map(Number);
      
      const debutMinutes = debutH * 60 + debutM;
      const finMinutes = finH * 60 + finM;
      
      return finMinutes > debutMinutes ? null : { finInferieurDebut: true };
    };
  }

  private loadHorairesData(): void {
    if (this.currentUser?.medecin) {
      const medecin = this.currentUser.medecin;
      
      // Charger la durée de consultation
      this.horairesForm.patchValue({
        duree_consultation: medecin.duree_consultation || 30
      });

      // Charger les horaires de travail
      if (medecin.horaires_travail) {
        Object.keys(medecin.horaires_travail).forEach(jour => {
          const horaires = medecin.horaires_travail[jour];
          if (horaires && horaires.debut && horaires.fin) {
            this.horairesForm.patchValue({
              [`${jour}_actif`]: true,
              [`${jour}_debut`]: horaires.debut,
              [`${jour}_fin`]: horaires.fin
            });
            
            // Mettre à jour l'état local
            const jourObj = this.joursSemaine.find(j => j.id === jour);
            if (jourObj) {
              jourObj.actif = true;
              jourObj.debut = horaires.debut;
              jourObj.fin = horaires.fin;
            }
          }
        });
      }
    }
    
    this.isLoading = false;
  }

  onJourToggle(jourId: string): void {
    const jour = this.joursSemaine.find(j => j.id === jourId);
    if (jour) {
      jour.actif = !jour.actif;
      this.horairesForm.patchValue({
        [`${jourId}_actif`]: jour.actif
      });
    }
  }

  onHeureChange(jourId: string, type: 'debut' | 'fin', value: string): void {
    const jour = this.joursSemaine.find(j => j.id === jourId);
    if (jour) {
      jour[type] = value;
      
      // Revalider le champ fin si on change le début
      if (type === 'debut') {
        this.horairesForm.get(`${jourId}_fin`)?.updateValueAndValidity();
      }
    }
  }

  onSubmit(): void {
    if (this.horairesForm.valid && !this.isSaving) {
      this.isSaving = true;
      
      const formData = this.horairesForm.value;
      
      // Construire l'objet horaires_travail
      const horaires_travail: any = {};
      
      this.joursSemaine.forEach(jour => {
        const actif = formData[`${jour.id}_actif`];
        if (actif) {
          horaires_travail[jour.id] = {
            debut: formData[`${jour.id}_debut`],
            fin: formData[`${jour.id}_fin`]
          };
        }
      });

      const updateData = {
        duree_consultation: formData.duree_consultation,
        horaires_travail: horaires_travail
      };

      this.apiService.updateMedecinDisponibilites(updateData).subscribe({
        next: (response) => {
          this.isSaving = false;
          if (response.success) {
            this.snackBar.open('Horaires mis à jour avec succès !', 'Fermer', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            
            // Rafraîchir les données utilisateur
            this.authService.refreshUser();
          }
        },
        error: (error) => {
          this.isSaving = false;
          const errorMessage = error.error?.message || 'Erreur lors de la mise à jour';
          this.snackBar.open(errorMessage, 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.horairesForm.controls).forEach(key => {
      const control = this.horairesForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(field: string): string {
    const control = this.horairesForm.get(field);
    
    if (control?.hasError('required')) {
      return 'Ce champ est obligatoire';
    }
    
    if (control?.hasError('min')) {
      return `Valeur minimum: ${control.errors?.['min'].min}`;
    }
    
    if (control?.hasError('max')) {
      return `Valeur maximum: ${control.errors?.['max'].max}`;
    }
    
    if (control?.hasError('finInferieurDebut')) {
      return 'L\'heure de fin doit être après l\'heure de début';
    }
    
    return '';
  }

  copierHoraires(jourSource: string): void {
    const source = this.joursSemaine.find(j => j.id === jourSource);
    if (!source || !source.actif) return;

    this.joursSemaine.forEach(jour => {
      if (jour.id !== jourSource && jour.actif) {
        jour.debut = source.debut;
        jour.fin = source.fin;
        
        this.horairesForm.patchValue({
          [`${jour.id}_debut`]: source.debut,
          [`${jour.id}_fin`]: source.fin
        });
      }
    });

    this.snackBar.open(`Horaires de ${source.nom} copiés sur les autres jours actifs`, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  activerTousLesJours(): void {
    this.joursSemaine.forEach(jour => {
      jour.actif = true;
      this.horairesForm.patchValue({
        [`${jour.id}_actif`]: true
      });
    });
  }

  desactiverTousLesJours(): void {
    this.joursSemaine.forEach(jour => {
      jour.actif = false;
      this.horairesForm.patchValue({
        [`${jour.id}_actif`]: false
      });
    });
  }

  getJoursActifs(): number {
    return this.joursSemaine.filter(j => j.actif).length;
  }

  getHeuresParSemaine(): number {
    let totalMinutes = 0;
    
    this.joursSemaine.forEach(jour => {
      if (jour.actif) {
        const [debutH, debutM] = jour.debut.split(':').map(Number);
        const [finH, finM] = jour.fin.split(':').map(Number);
        
        const debutMinutes = debutH * 60 + debutM;
        const finMinutes = finH * 60 + finM;
        
        totalMinutes += (finMinutes - debutMinutes);
      }
    });
    
    return Math.round(totalMinutes / 60 * 10) / 10; // Arrondi à 1 décimale
  }

  calculerNombreCreneaux(debut: string, fin: string): number {
  if (!debut || !fin) return 0;
  
  const [debutH, debutM] = debut.split(':').map(Number);
  const [finH, finM] = fin.split(':').map(Number);
  
  const debutMinutes = debutH * 60 + debutM;
  const finMinutes = finH * 60 + finM;
  const dureeConsultation = this.horairesForm.get('duree_consultation')?.value || 30;
  
  const dureeDisponible = finMinutes - debutMinutes;
  return Math.floor(dureeDisponible / dureeConsultation);
}
}