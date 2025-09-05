// src/app/components/patient/patient-profil/patient-profil.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService, User } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-patient-profil',
  templateUrl: './patient-profil.component.html',
  styleUrls: ['./patient-profil.component.scss']
})
export class PatientProfilComponent implements OnInit {
  currentUser: User | null = null;
  profilForm!: FormGroup;
  isLoading = true;
  isSaving = false;
  
  maxDate = new Date(); // Date max = aujourd'hui

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initializeForm();
    this.loadProfilData();
  }

  private initializeForm(): void {
    this.profilForm = this.fb.group({
      // Informations utilisateur (non modifiables ici)
      nom: [{ value: '', disabled: true }],
      prenom: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      telephone: ['', [Validators.pattern(/^(\+221|221)?[0-9]{9}$/)]],
      adresse: [''],
      
      // Informations patient
      date_naissance: ['', Validators.required],
      sexe: ['', Validators.required],
      profession: ['', [Validators.maxLength(255)]],
      allergies: ['', [Validators.maxLength(1000)]],
      antecedents_medicaux: ['', [Validators.maxLength(1000)]],
      mutuelle: ['', [Validators.maxLength(255)]],
      numero_securite_sociale: ['', [Validators.maxLength(15)]]
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

      // Charger les données du patient
      if (this.currentUser.patient) {
        this.profilForm.patchValue({
          date_naissance: this.currentUser.patient.date_naissance,
          sexe: this.currentUser.patient.sexe,
          profession: this.currentUser.patient.profession,
          allergies: this.currentUser.patient.allergies,
          antecedents_medicaux: this.currentUser.patient.antecedents_medicaux,
          mutuelle: this.currentUser.patient.mutuelle,
          numero_securite_sociale: this.currentUser.patient.numero_securite_sociale
        });
      }
    }
    
    this.isLoading = false;
  }

  onSubmit(): void {
    if (this.profilForm.valid && !this.isSaving) {
      this.isSaving = true;
      
      const formData = this.profilForm.value;
      
      // Préparer les données pour l'API
      const updateData = {
        telephone: formData.telephone,
        adresse: formData.adresse,
        date_naissance: formData.date_naissance,
        sexe: formData.sexe,
        profession: formData.profession,
        allergies: formData.allergies,
        antecedents_medicaux: formData.antecedents_medicaux,
        mutuelle: formData.mutuelle,
        numero_securite_sociale: formData.numero_securite_sociale
      };

      this.apiService.updatePatientProfil(updateData).subscribe({
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
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.profilForm.controls).forEach(key => {
      const control = this.profilForm.get(key);
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
    
    return '';
  }

  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      date_naissance: 'La date de naissance',
      sexe: 'Le sexe',
      profession: 'La profession',
      telephone: 'Le téléphone',
      allergies: 'Les allergies',
      antecedents_medicaux: 'Les antécédents médicaux',
      mutuelle: 'La mutuelle',
      numero_securite_sociale: 'Le numéro de sécurité sociale'
    };
    
    return labels[field] || field;
  }

  getAge(): number | null {
    const dateNaissance = this.profilForm.get('date_naissance')?.value;
    if (dateNaissance) {
      const today = new Date();
      const birth = new Date(dateNaissance);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    }
    return null;
  }
}