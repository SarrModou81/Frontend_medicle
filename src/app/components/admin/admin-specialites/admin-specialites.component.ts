// src/app/components/admin/admin-specialites/admin-specialites.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, Specialite } from '../../../services/api.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-specialites',
  templateUrl: './admin-specialites.component.html',
  styleUrls: ['./admin-specialites.component.scss']
})
export class AdminSpecialitesComponent implements OnInit {
  specialites: Specialite[] = [];
  isLoading = true;
  isSaving = false;
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  
  // Filtres
  searchTerm = '';
  selectedActive = '';
  
  activeOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'true', label: 'Actives' },
    { value: 'false', label: 'Inactives' }
  ];
  
  displayedColumns: string[] = ['icone', 'nom', 'description', 'prix', 'medecins', 'statut', 'date_creation', 'actions'];
  
  // Dialog
  showDialog = false;
  isEditMode = false;
  specialiteForm!: FormGroup;
  
  iconesDisponibles = [
    'favorite',
    'healing',
    'local_hospital',
    'medical_services',
    'monitor_heart',
    'psychology',
    'visibility',
    'hearing',
    'child_care',
    'elderly',
    'vaccines',
    'biotech',
    'science'
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadSpecialites();
  }

  private initializeForm(): void {
    this.specialiteForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(1000)]],
      icone: ['medical_services', Validators.required],
      prix_consultation: ['', [Validators.required, Validators.min(0), Validators.max(1000000)]],
      active: [true]
    });
  }

  loadSpecialites(): void {
    this.isLoading = true;
    
    const params: any = {
      page: this.currentPage
    };

    if (this.searchTerm) {
      params.search = this.searchTerm;
    }
    if (this.selectedActive !== '') {
      params.active = this.selectedActive;
    }

    this.apiService.getAdminSpecialites(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.specialites = response.data.data;
          this.currentPage = response.data.current_page;
          this.totalPages = response.data.last_page;
          this.totalItems = response.data.total;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des spécialités:', error);
        this.snackBar.open('Erreur lors du chargement des spécialités', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadSpecialites();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadSpecialites();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedActive = '';
    this.currentPage = 1;
    this.loadSpecialites();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadSpecialites();
  }

  ouvrirDialogSpecialite(specialite?: Specialite): void {
    this.isEditMode = !!specialite;
    this.showDialog = true;
    
    if (specialite) {
      this.specialiteForm.patchValue({
        nom: specialite.nom,
        description: specialite.description,
        icone: specialite.icone || 'medical_services',
        prix_consultation: specialite.prix_consultation,
        active: specialite.active
      });
    } else {
      this.specialiteForm.reset({
        nom: '',
        description: '',
        icone: 'medical_services',
        prix_consultation: '',
        active: true
      });
    }
  }

  fermerDialog(): void {
    this.showDialog = false;
    this.isEditMode = false;
    this.specialiteForm.reset();
  }

  sauvegarderSpecialite(): void {
    if (!this.specialiteForm.valid || this.isSaving) {
      return;
    }

    this.isSaving = true;
    const formData = this.specialiteForm.value;

    const observable = this.isEditMode
      ? this.apiService.modifierSpecialite(this.getSelectedSpecialiteId(), formData)
      : this.apiService.creerSpecialite(formData);

    observable.subscribe({
      next: (response) => {
        this.isSaving = false;
        if (response.success) {
          this.snackBar.open(
            this.isEditMode ? 'Spécialité modifiée avec succès' : 'Spécialité créée avec succès',
            'Fermer',
            {
              duration: 3000,
              panelClass: ['success-snackbar']
            }
          );
          this.fermerDialog();
          this.loadSpecialites();
        }
      },
      error: (error) => {
        this.isSaving = false;
        const errorMessage = error.error?.message || 'Erreur lors de la sauvegarde';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private getSelectedSpecialiteId(): number {
    // Cette méthode devrait retourner l'ID de la spécialité en cours d'édition
    // Vous devrez l'adapter selon votre logique
    return 0; // À remplacer par la logique appropriée
  }

  toggleStatut(specialite: Specialite): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: specialite.active ? 'Désactiver la spécialité' : 'Activer la spécialité',
        message: `Voulez-vous ${specialite.active ? 'désactiver' : 'activer'} la spécialité "${specialite.nom}" ?`,
        confirmText: specialite.active ? 'Désactiver' : 'Activer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const updateData = { active: !specialite.active };
        
        this.apiService.modifierSpecialite(specialite.id, updateData).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Statut mis à jour avec succès', 'Fermer', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadSpecialites();
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

  supprimerSpecialite(specialite: Specialite): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer la spécialité',
        message: `Êtes-vous sûr de vouloir supprimer la spécialité "${specialite.nom}" ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.apiService.supprimerSpecialite(specialite.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Spécialité supprimée avec succès', 'Fermer', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadSpecialites();
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

  getIconePreview(icone?: string): string {
    return icone || 'medical_services';
  }

formatPrix(prix: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(prix);
  }

  getStatutColor(active: boolean): string {
    return active ? 'primary' : 'warn';
  }

  getStatutLabel(active: boolean): string {
    return active ? 'Active' : 'Inactive';
  }
}