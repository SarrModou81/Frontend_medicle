// src/app/components/auth/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { ApiService, Specialite } from '../../../services/api.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  hidePassword = true;
  hidePasswordConfirm = true;
  specialites: Specialite[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Si l'utilisateur est déjà connecté, le rediriger
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.redirectBasedOnRole(user.role);
        return;
      }
    }

    this.initializeForm();
    this.loadSpecialites();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      role: ['patient', Validators.required],
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      prenom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.pattern(/^(\+221|221)?[0-9]{9}$/)]],
      adresse: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required],
      
      // Champs patient
      date_naissance: [''],
      sexe: [''],
      
      // Champs médecin
      specialite_id: [''],
      numero_ordre: [''],
      prix_consultation: ['']
    }, { 
      validators: this.passwordMatchValidator 
    });

    // Observer les changements de rôle
    this.registerForm.get('role')?.valueChanges.subscribe(role => {
      this.updateValidators(role);
    });
  }

  private passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('password_confirmation');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  private updateValidators(role: string): void {
    const dateNaissance = this.registerForm.get('date_naissance');
    const sexe = this.registerForm.get('sexe');
    const specialiteId = this.registerForm.get('specialite_id');
    const numeroOrdre = this.registerForm.get('numero_ordre');
    const prixConsultation = this.registerForm.get('prix_consultation');

    // Réinitialiser les validateurs
    dateNaissance?.clearValidators();
    sexe?.clearValidators();
    specialiteId?.clearValidators();
    numeroOrdre?.clearValidators();
    prixConsultation?.clearValidators();

    if (role === 'patient') {
      dateNaissance?.setValidators([Validators.required]);
      sexe?.setValidators([Validators.required]);
    } else if (role === 'medecin') {
      specialiteId?.setValidators([Validators.required]);
      numeroOrdre?.setValidators([Validators.required, Validators.pattern(/^[A-Z]{2}[0-9]{6}$/)]);
      prixConsultation?.setValidators([Validators.required, Validators.min(10000), Validators.max(100000)]);
    }

    // Mettre à jour la validité
    dateNaissance?.updateValueAndValidity();
    sexe?.updateValueAndValidity();
    specialiteId?.updateValueAndValidity();
    numeroOrdre?.updateValueAndValidity();
    prixConsultation?.updateValueAndValidity();
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

  onSubmit(): void {
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      const formData = { ...this.registerForm.value };
      
      // Formatage des données selon le rôle
      if (formData.role === 'patient') {
        delete formData.specialite_id;
        delete formData.numero_ordre;
        delete formData.prix_consultation;
      } else if (formData.role === 'medecin') {
        delete formData.date_naissance;
        delete formData.sexe;
      }

      this.authService.register(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.snackBar.open('Inscription réussie ! Bienvenue !', 'Fermer', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            
            this.redirectBasedOnRole(response.user.role);
          }
        },
        error: (error) => {
          this.isLoading = false;
          
          let errorMessage = 'Erreur lors de l\'inscription';
          
          if (error.error?.errors) {
            // Erreurs de validation spécifiques
            const errors = error.error.errors;
            const firstError = Object.keys(errors)[0];
            errorMessage = errors[firstError][0];
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
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

  private redirectBasedOnRole(role: string): void {
    switch (role) {
      case 'patient':
        this.router.navigate(['/dashboard/patient']);
        break;
      case 'medecin':
        this.router.navigate(['/dashboard/medecin']);
        break;
      case 'admin':
        this.router.navigate(['/dashboard/admin']);
        break;
      default:
        this.router.navigate(['/dashboard']);
        break;
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(field: string): string {
    const control = this.registerForm.get(field);
    
    if (control?.hasError('required')) {
      return `Le champ ${this.getFieldLabel(field)} est obligatoire`;
    }
    
    if (control?.hasError('email')) {
      return 'Veuillez entrer une adresse email valide';
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Minimum ${minLength} caractères requis`;
    }
    
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `Maximum ${maxLength} caractères autorisés`;
    }
    
    if (control?.hasError('pattern')) {
      if (field === 'telephone') {
        return 'Format: +221 77 XXX XX XX';
      }
      if (field === 'numero_ordre') {
        return 'Format: SN123456';
      }
    }
    
    if (control?.hasError('min')) {
      return `Valeur minimum: ${control.errors?.['min'].min}`;
    }
    
    if (control?.hasError('max')) {
      return `Valeur maximum: ${control.errors?.['max'].max}`;
    }
    
    if (field === 'password_confirmation' && this.registerForm.hasError('passwordMismatch')) {
      return 'Les mots de passe ne correspondent pas';
    }
    
    return '';
  }

  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      nom: 'nom',
      prenom: 'prénom',
      email: 'email',
      password: 'mot de passe',
      password_confirmation: 'confirmation du mot de passe',
      telephone: 'téléphone',
      date_naissance: 'date de naissance',
      sexe: 'sexe',
      specialite_id: 'spécialité',
      numero_ordre: 'numéro d\'ordre',
      prix_consultation: 'prix de consultation'
    };
    
    return labels[field] || field;
  }

  get isPatient(): boolean {
    return this.registerForm.get('role')?.value === 'patient';
  }

  get isMedecin(): boolean {
    return this.registerForm.get('role')?.value === 'medecin';
  }
}