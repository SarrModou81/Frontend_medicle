// src/app/components/patient/rendez-vous-form/rendez-vous-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, Medecin, CreneauDisponible } from '../../../services/api.service';

@Component({
  selector: 'app-rendez-vous-form',
  templateUrl: './rendez-vous-form.component.html',
  styleUrls: ['./rendez-vous-form.component.scss']
})
export class RendezVousFormComponent implements OnInit {
  rdvForm!: FormGroup;
  medecin: Medecin | null = null;
  isLoading = true;
  isLoadingSlots = false;
  isSubmitting = false;
  
  medecinId: number = 0;
  selectedDate: string = '';
  availableSlots: CreneauDisponible[] = [];
  
  minDate = new Date();
  maxDate = new Date();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {
    // Date max = dans 3 mois
    this.maxDate.setMonth(this.maxDate.getMonth() + 3);
  }

  ngOnInit(): void {
    this.medecinId = Number(this.route.snapshot.queryParamMap.get('medecinId'));
    
    if (!this.medecinId) {
      this.snackBar.open('Médecin non spécifié', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      this.router.navigate(['/dashboard/patient/medecins']);
      return;
    }

    this.initializeForm();
    this.loadMedecinData();
  }

  private initializeForm(): void {
    this.rdvForm = this.fb.group({
      date: ['', Validators.required],
      heure: ['', Validators.required],
      motif: ['', [Validators.maxLength(500)]],
      type_paiement: ['au_cabinet', Validators.required]
    });

    // Observer les changements de date
    this.rdvForm.get('date')?.valueChanges.subscribe(date => {
      if (date) {
        this.selectedDate = date;
        this.loadAvailableSlots();
        // Réinitialiser l'heure sélectionnée
        this.rdvForm.patchValue({ heure: '' });
      }
    });
  }

  private loadMedecinData(): void {
    this.apiService.getMedecin(this.medecinId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.medecin = response.data;
          
          // Configurer le type de paiement selon les préférences du médecin
          if (this.medecin.accepte_paiement_ligne) {
            this.rdvForm.patchValue({ type_paiement: 'en_ligne' });
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du médecin:', error);
        this.snackBar.open('Erreur lors du chargement des informations du médecin', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/dashboard/patient/medecins']);
      }
    });
  }

  private loadAvailableSlots(): void {
    if (!this.selectedDate || !this.medecin) return;

    this.isLoadingSlots = true;
    this.availableSlots = [];

    const dateStr = new Date(this.selectedDate).toISOString().split('T')[0];

    this.apiService.getCreneauxDisponibles(this.medecinId, dateStr).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableSlots = response.data.filter((slot: CreneauDisponible) => slot.disponible);
        }
        this.isLoadingSlots = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des créneaux:', error);
        this.snackBar.open('Erreur lors du chargement des créneaux disponibles', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoadingSlots = false;
      }
    });
  }

  dateFilter = (date: Date | null): boolean => {
    if (!date || !this.medecin?.horaires_travail) return false;
    
    const day = date.getDay();
    const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const dayName = dayNames[day];
    
    // Vérifier si le médecin travaille ce jour
    return !!this.medecin.horaires_travail[dayName];
  };

  onSubmit(): void {
    if (!this.rdvForm.valid || this.isSubmitting || !this.medecin) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    
    const formData = this.rdvForm.value;
    
    // Construire la date/heure complète
    const dateHeure = new Date(formData.date);
    const [heures, minutes] = formData.heure.split(':');
    dateHeure.setHours(parseInt(heures), parseInt(minutes), 0, 0);

    const rdvData = {
      medecin_id: this.medecinId,
      date_heure: dateHeure.toISOString(),
      duree: this.medecin.duree_consultation,
      motif: formData.motif || null,
      type_paiement: formData.type_paiement,
      montant: this.medecin.prix_consultation
    };

    this.apiService.creerRendezVous(rdvData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success && response.data) {
          this.snackBar.open('Rendez-vous créé avec succès !', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Rediriger selon le type de paiement
          if (formData.type_paiement === 'en_ligne') {
            this.router.navigate(['/dashboard/patient/paiement', response.data.id]);
          } else {
            this.router.navigate(['/dashboard/patient/rendez-vous']);
          }
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        let errorMessage = 'Erreur lors de la création du rendez-vous';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.errors) {
          const firstError = Object.keys(error.error.errors)[0];
          errorMessage = error.error.errors[firstError][0];
        }
        
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.rdvForm.controls).forEach(key => {
      const control = this.rdvForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(field: string): string {
    const control = this.rdvForm.get(field);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(field)} est obligatoire`;
    }
    
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `Maximum ${maxLength} caractères autorisés`;
    }
    
    return '';
  }

  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      date: 'La date',
      heure: 'L\'heure',
      motif: 'Le motif',
      type_paiement: 'Le type de paiement'
    };
    
    return labels[field] || field;
  }

  goBack(): void {
    this.router.navigate(['/dashboard/patient/medecins']);
  }

  formatPrix(prix: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(prix);
  }
}