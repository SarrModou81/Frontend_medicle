// src/app/components/admin/admin-users/admin-users.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, User, Specialite } from '../../../services/api.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit {
  utilisateurs: User[] = [];
  specialites: Specialite[] = [];
  isLoading = true;
  isSaving = false;
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  
  // Filtres
  searchTerm = '';
  selectedRole = '';
  selectedStatut = '';
  selectedSpecialite = '';
  
  displayedColumns: string[] = ['utilisateur', 'role', 'statut', 'specialite', 'infos', 'date_creation', 'actions'];
  
  // Dialog
  showDialog = false;
  isEditMode = false;
  selectedUser: User | null = null;
  userForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadSpecialites();
    this.loadUtilisateurs();
  }

  private initializeForm(): void {
    this.userForm = this.fb.group({
      // Informations de base
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      prenom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.pattern(/^(\+221|221)?[0-9]{9}$/)]],
      adresse: [''],
      role: ['patient', Validators.required],
      statut: ['actif', Validators.required],
      
      // Mot de passe (uniquement pour création)
      password: [''],
      password_confirmation: [''],
      
      // Champs patient
      date_naissance: [''],
      sexe: [''],
      profession: [''],
      
      // Champs médecin
      specialite_id: [''],
      numero_ordre: [''],
      prix_consultation: [''],
      experience_annees: ['']
    });

    // Observer les changements de rôle
    this.userForm.get('role')?.valueChanges.subscribe(role => {
      this.updateValidators(role);
    });
  }

  private updateValidators(role: string): void {
    // Réinitialiser les validateurs
    this.clearValidators();

    // Mot de passe obligatoire uniquement pour création
    if (!this.isEditMode) {
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.userForm.get('password_confirmation')?.setValidators([Validators.required]);
    }

    // Validateurs spécifiques par rôle
    if (role === 'patient') {
      this.userForm.get('date_naissance')?.setValidators([Validators.required]);
      this.userForm.get('sexe')?.setValidators([Validators.required]);
    } else if (role === 'medecin') {
      this.userForm.get('specialite_id')?.setValidators([Validators.required]);
      this.userForm.get('numero_ordre')?.setValidators([Validators.required]);
      this.userForm.get('prix_consultation')?.setValidators([Validators.required, Validators.min(0)]);
      this.userForm.get('experience_annees')?.setValidators([Validators.min(0), Validators.max(50)]);
    }

    // Mettre à jour la validité
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.updateValueAndValidity();
    });
  }

  private clearValidators(): void {
    const fieldsToReset = [
      'password', 'password_confirmation', 'date_naissance', 'sexe', 'profession',
      'specialite_id', 'numero_ordre', 'prix_consultation', 'experience_annees'
    ];
    
    fieldsToReset.forEach(field => {
      this.userForm.get(field)?.clearValidators();
      this.userForm.get(field)?.updateValueAndValidity();
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

  loadUtilisateurs(): void {
    this.isLoading = true;
    
    const params: any = {
      page: this.currentPage
    };

    if (this.searchTerm) {
      params.search = this.searchTerm;
    }
    if (this.selectedRole) {
      params.role = this.selectedRole;
    }
    if (this.selectedStatut) {
      params.statut = this.selectedStatut;
    }
    if (this.selectedSpecialite) {
      params.specialite_id = this.selectedSpecialite;
    }

    this.apiService.getAdminUtilisateurs(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.utilisateurs = response.data.data;
          this.currentPage = response.data.current_page;
          this.totalPages = response.data.last_page;
          this.totalItems = response.data.total;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.snackBar.open('Erreur lors du chargement des utilisateurs', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadUtilisateurs();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadUtilisateurs();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatut = '';
    this.selectedSpecialite = '';
    this.currentPage = 1;
    this.loadUtilisateurs();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUtilisateurs();
  }

  ouvrirDialogUtilisateur(user?: User): void {
    this.isEditMode = !!user;
    this.selectedUser = user || null;
    this.showDialog = true;
    
    if (user) {
      this.userForm.patchValue({
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        adresse: user.adresse,
        role: user.role,
        statut: user.statut,
        
        // Données patient
        date_naissance: user.patient?.date_naissance,
        sexe: user.patient?.sexe,
        profession: user.patient?.profession,
        
        // Données médecin
        specialite_id: user.medecin?.specialite_id,
        numero_ordre: user.medecin?.numero_ordre,
        prix_consultation: user.medecin?.prix_consultation,
        experience_annees: user.medecin?.experience_annees
      });
      
      this.updateValidators(user.role);
    } else {
      this.userForm.reset({
        role: 'patient',
        statut: 'actif'
      });
      this.updateValidators('patient');
    }
  }

  fermerDialog(): void {
    this.showDialog = false;
    this.isEditMode = false;
    this.selectedUser = null;
    this.userForm.reset();
  }

  sauvegarderUtilisateur(): void {
    if (!this.userForm.valid || this.isSaving) {
      this.markFormGroupTouched();
      return;
    }

    this.isSaving = true;
    const formData = this.userForm.value;

    // Nettoyer les données selon le rôle
    if (formData.role === 'patient') {
      delete formData.specialite_id;
      delete formData.numero_ordre;
      delete formData.prix_consultation;
      delete formData.experience_annees;
    } else if (formData.role === 'medecin') {
      delete formData.date_naissance;
      delete formData.sexe;
      delete formData.profession;
    }

    // Supprimer les mots de passe vides en mode édition
    if (this.isEditMode) {
      if (!formData.password) {
        delete formData.password;
        delete formData.password_confirmation;
      }
    }

    const observable = this.isEditMode && this.selectedUser
      ? this.apiService.modifierUtilisateur(this.selectedUser.id, formData)
      : this.apiService.creerUtilisateur(formData);

    observable.subscribe({
      next: (response) => {
        this.isSaving = false;
        if (response.success) {
          this.snackBar.open(
            this.isEditMode ? 'Utilisateur modifié avec succès' : 'Utilisateur créé avec succès',
            'Fermer',
            {
              duration: 3000,
              panelClass: ['success-snackbar']
            }
          );
          this.fermerDialog();
          this.loadUtilisateurs();
        }
      },
      error: (error) => {
        this.isSaving = false;
        let errorMessage = 'Erreur lors de la sauvegarde';
        
        if (error.error?.errors) {
          const firstError = Object.keys(error.error.errors)[0];
          errorMessage = error.error.errors[firstError][0];
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  changerStatut(user: User): void {
    const nouveauStatut = user.statut === 'actif' ? 'inactif' : 'actif';
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `${nouveauStatut === 'actif' ? 'Activer' : 'Désactiver'} l'utilisateur`,
        message: `Voulez-vous ${nouveauStatut === 'actif' ? 'activer' : 'désactiver'} l'utilisateur ${user.prenom} ${user.nom} ?`,
        confirmText: nouveauStatut === 'actif' ? 'Activer' : 'Désactiver',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.apiService.changerStatutUtilisateur(user.id, { statut: nouveauStatut }).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Statut mis à jour avec succès', 'Fermer', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadUtilisateurs();
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
    });
  }

  supprimerUtilisateur(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer l\'utilisateur',
        message: `Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.prenom} ${user.nom} ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.apiService.supprimerUtilisateur(user.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Utilisateur supprimé avec succès', 'Fermer', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadUtilisateurs();
            }
          },
          error: (error) => {
            const errorMessage = error.error?.message || 'Erreur lors de la suppression';
            this.snackBar.open(errorMessage, 'Fermer', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  getUserIcon(role: string): string {
    switch (role) {
      case 'patient':
        return 'person';
      case 'medecin':
        return 'medical_services';
      case 'admin':
        return 'admin_panel_settings';
      default:
        return 'person';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'patient':
        return 'Patient';
      case 'medecin':
        return 'Médecin';
      case 'admin':
        return 'Administrateur';
      default:
        return role;
    }
  }

  getStatutColor(statut: string): string {
    switch (statut) {
      case 'actif':
        return 'primary';
      case 'suspendu':
        return 'accent';
      default:
        return 'warn';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'actif':
        return 'Actif';
      case 'inactif':
        return 'Inactif';
      case 'suspendu':
        return 'Suspendu';
      default:
        return statut;
    }
  }

  calculateAge(dateNaissance: string): number {
    const today = new Date();
    const birth = new Date(dateNaissance);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  get isPatient(): boolean {
    return this.userForm.get('role')?.value === 'patient';
  }

  get isMedecin(): boolean {
    return this.userForm.get('role')?.value === 'medecin';
  }
}