// src/app/components/medecin/medecin-profil/medecin-profil.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService, User } from '../../../services/auth.service';
import { ApiService, Specialite } from '../../../services/api.service';

@Component({
  selector: 'app-medecin-profil',
  templateUrl: './medecin-profil.component.html',
  styleUrls: ['./medecin-profil.component.scss']
})
export class MedecinProfilComponent implements OnInit {
  currentUser: User | null = null;
  profilForm!: FormGroup;
  disponibiliteForm!: FormGroup;
  isLoading = true;
  isSaving = false;
  specialites: Specialite[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initializeForms();
    this.loadSpecialites();
    this.loadProfilData();
  }

  private initializeForms(): void {
    this.profilForm = this.fb.group({
      // Informations utilisateur (non modifiables ici)
      nom: [{ value: '', disabled: true }],
      prenom: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      telephone: ['', [Validators.pattern(/^(\+221|221)?[0-9]{9}$/)]],
      adresse: [''],
      
      // Informations médecin
      presentation: ['', [Validators.maxLength(1000)]],
      cabinet_nom: ['', [Validators.maxLength(255)]],
      cabinet_adresse: ['', [Validators.maxLength(500)]],
      prix_consultation: ['', [Validators.required, Validators.min(0), Validators.max(1000000)]],
      duree_consultation: ['', [Validators.required, Validators.min(15), Validators.max(120)]],
      accepte_paiement_ligne: [true],
      experience_annees: ['', [Validators.min(0), Validators.max(50)]],
      diplomes: ['', [Validators.maxLength(1000)]]
    });

    this.disponibiliteForm = this.fb.group({
      disponible: [true]
    });
  }

  private loadSpecialites(): void {
    this.apiService.getSpecialites().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.specialites = response.data;
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des spécialités:', error);
      }
    });
  }

  private loadProfilData(): void {
    if (this.currentUser) {
      // Charger les données de base de l'utilisateur
      this.profilForm.patchValue({
        nom: this.currentUser.nom,
        prenom: this.currentUser.prenom,
        email: this.currentUser.email,
        telephone: this.currentUser.telephone,
        adresse: this.currentUser.adresse
      });

      // Charger les données du médecin
      if (this.currentUser.medecin) {
        this.profilForm.patchValue({
          presentation: this.currentUser.medecin.presentation,
          cabinet_nom: this.currentUser.medecin.cabinet_nom,
          cabinet_adresse: this.currentUser.medecin.cabinet_adresse,
          prix_consultation: this.currentUser.medecin.prix_consultation,
          duree_consultation: this.currentUser.medecin.duree_consultation,
          accepte_paiement_ligne: this.currentUser.medecin.accepte_paiement_ligne,
          experience_annees: this.currentUser.medecin.experience_annees,
          diplomes: this.currentUser.medecin.diplomes
        });

        this.disponibiliteForm.patchValue({
          disponible: this.currentUser.medecin.disponible
        });
      }
    }
    
    this.isLoading = false;
  }

  onSubmitProfil(): void {
    if (this.profilForm.valid && !this.isSaving) {
      this.isSaving = true;
      
      const formData = this.profilForm.value;
      
      // Préparer les données pour l'API
      const updateData = {
        telephone: formData.telephone,
        adresse: formData.adresse,
        presentation: formData.presentation,
        cabinet_nom: formData.cabinet_nom,
        cabinet_adresse: formData.cabinet_adresse,
        prix_consultation: formData.prix_consultation,
        duree_consultation: formData.duree_consultation,
        accepte_paiement_ligne: formData.accepte_paiement_ligne,
        experience_annees: formData.experience_annees,
        diplomes: formData.diplomes
      };

      this.apiService.updateMedecinProfil(updateData).subscribe({
        next: (response) => {
          this.isSaving = false;
          if (response.success) {
            this.snackBar.open('Profil mis à jour avec succès !', 'Fermer', {
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
      this.markFormGroupTouched(this.profilForm);
    }
  }

  onSubmitDisponibilite(): void {
    if (this.disponibiliteForm.valid) {
      const updateData = this.disponibiliteForm.value;

      this.apiService.updateMedecinDisponibilite(updateData).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Disponibilité mise à jour avec succès !', 'Fermer', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            
            // Rafraîchir les données utilisateur
            this.authService.refreshUser();
          }
        },
        error: (error) => {
          const errorMessage = error.error?.message || 'Erreur lors de la mise à jour';
          this.snackBar.open(errorMessage, 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control && control.enabled) {
        control.markAsTouched();
      }
    });
  }

  getErrorMessage(field: string): string {
    const control = this.profilForm.get(field);
    
    if (control?.hasError('required')) {
      return this.getFieldLabel(field) + ' est obligatoire';
    }
    
    if (control?.hasError('pattern')) {
      if (field === 'telephone') {
        return 'Format: +221 77 XXX XX XX';
      }
    }
    
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `Maximum ${maxLength} caractères autorisés`;
    }
    
    if (control?.hasError('min')) {
      return `Valeur minimum: ${control.errors?.['min'].min}`;
    }
    
    if (control?.hasError('max')) {
      return `Valeur maximum: ${control.errors?.['max'].max}`;
    }
    
    return '';
  }

  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      prix_consultation: 'Le prix de consultation',
      duree_consultation: 'La durée de consultation',
      presentation: 'La présentation',
      cabinet_nom: 'Le nom du cabinet',
      cabinet_adresse: 'L\'adresse du cabinet',
      experience_annees: 'L\'expérience',
      diplomes: 'Les diplômes',
      telephone: 'Le téléphone'
    };
    
    return labels[field] || field;
  }

  getSpecialiteNom(): string {
    if (!this.currentUser?.medecin?.specialite_id) return 'Non définie';
    
    const specialite = this.specialites.find(s => s.id === this.currentUser?.medecin?.specialite_id);
    return specialite?.nom || 'Spécialité inconnue';
  }
}