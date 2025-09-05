// src/app/components/patient/medecin-list/medecin-list.component.ts - CORRIGÉ
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService, Medecin, Specialite } from '../../../services/api.service';

@Component({
  selector: 'app-medecin-list',
  templateUrl: './medecin-list.component.html',
  styleUrls: ['./medecin-list.component.scss']
})
export class MedecinListComponent implements OnInit {
  searchForm!: FormGroup;
  medecins: Medecin[] = [];
  specialites: Specialite[] = [];
  isLoading = true;
  isSearching = false;
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 12;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadSpecialites();
    this.loadMedecins();
    this.setupSearchSubscription();
  }

  private initializeForm(): void {
    this.searchForm = this.fb.group({
      search: [''],
      specialite_id: [''],
      ville: [''],
      tri_prix: ['']
    });
  }

  private setupSearchSubscription(): void {
    // Recherche en temps réel avec debounce
    this.searchForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadMedecins();
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

  private loadMedecins(): void {
    this.isSearching = true;
    
    const formValues = this.searchForm.value;
    const params: any = {
      page: this.currentPage
    };

    // Ajouter les paramètres de recherche
    Object.keys(formValues).forEach(key => {
      if (formValues[key] && formValues[key] !== '') {
        params[key] = formValues[key];
      }
    });

    this.apiService.getMedecins(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.medecins = response.data.data;
          this.currentPage = response.data.current_page;
          this.totalPages = response.data.last_page;
          this.totalItems = response.data.total;
        }
        this.isLoading = false;
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des médecins:', error);
        this.snackBar.open('Erreur lors du chargement des médecins', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
        this.isSearching = false;
      }
    });
  }

  clearFilters(): void {
    this.searchForm.reset();
    this.currentPage = 1;
    this.loadMedecins();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadMedecins();
  }

  voirDetails(medecin: Medecin): void {
    if (!medecin.disponible) {
      this.snackBar.open('Ce médecin n\'est pas disponible actuellement', 'Fermer', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    // Naviguer vers le formulaire de prise de rendez-vous
    this.router.navigate(['/dashboard/patient/rendez-vous/nouveau'], {
      queryParams: { medecinId: medecin.id }
    });
  }

  formatExperience(annees: number): string {
    if (!annees || annees === 0) {
      return 'Nouveau';
    } else if (annees === 1) {
      return '1 an d\'expérience';
    } else {
      return `${annees} ans d'expérience`;
    }
  }

  formatPrix(prix: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(prix);
  }

  getSpecialiteColor(specialite: string): string {
    // Couleurs basées sur la spécialité
    const colors: { [key: string]: string } = {
      'Cardiologie': '#f44336',
      'Dermatologie': '#ff9800',
      'Pédiatrie': '#4caf50',
      'Gynécologie': '#e91e63',
      'Ophtalmologie': '#2196f3',
      'ORL': '#9c27b0',
      'Neurologie': '#607d8b',
      'Psychiatrie': '#795548',
      'Dentaire': '#00bcd4',
      'Médecine Générale': '#3f51b5'
    };
    
    return colors[specialite] || '#666';
  }

  trackByMedecinId(index: number, medecin: Medecin): number {
    return medecin.id;
  }
}